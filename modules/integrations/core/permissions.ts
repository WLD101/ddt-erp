import { getIndustryCapabilities } from "./types";
import type {
  IntegrationActionDefinition,
  IntegrationPermissionDecision,
  IntegrationRequestSource,
  TenantIntegrationRecord,
} from "./types";

type PermissionRule = {
  subjectType: "tenant" | "role" | "user" | "voice_agent";
  subjectId: string;
  actionKey: string;
  effect: "allow" | "deny" | "approval_required";
};

export function evaluateIntegrationPermission(input: {
  providerEnabled: boolean;
  featureEnabled: boolean;
  planAllowed: boolean;
  requestSource: IntegrationRequestSource;
  integration: TenantIntegrationRecord;
  action: IntegrationActionDefinition;
  industryProfileKey?: string | null;
  grantedScopes: string[];
  rules?: PermissionRule[];
  role?: string;
  userId?: string;
  voiceAgentId?: string;
}) : IntegrationPermissionDecision {
  const matchedRules: string[] = [];

  if (!input.providerEnabled || !input.featureEnabled) {
    return { allowed: false, requiresApproval: false, reasonCode: "PROVIDER_DISABLED", matchedRules };
  }

  if (!input.planAllowed) {
    return { allowed: false, requiresApproval: false, reasonCode: "PLAN_RESTRICTED", matchedRules };
  }

  if (!["connected", "degraded"].includes(input.integration.status)) {
    return { allowed: false, requiresApproval: false, reasonCode: "CONNECTION_NOT_READY", matchedRules };
  }

  if (!input.action.allowedRequestSources.includes(input.requestSource)) {
    return { allowed: false, requiresApproval: false, reasonCode: "REQUEST_SOURCE_DENIED", matchedRules };
  }

  const industryCapabilities = getIndustryCapabilities((input.industryProfileKey as never) || undefined);
  const missingCapability = (input.action.requiredIndustryCapabilities || []).find(
    (capability) => !industryCapabilities.includes(capability)
  );
  if (missingCapability) {
    return { allowed: false, requiresApproval: false, reasonCode: "INDUSTRY_CAPABILITY_MISSING", matchedRules };
  }

  const missingScope = (input.action.requiredProviderScopes || []).find(
    (scope) => !input.grantedScopes.includes(scope)
  );
  if (missingScope) {
    return { allowed: false, requiresApproval: false, reasonCode: "MISSING_SCOPE", matchedRules };
  }

  const orderedRules = input.rules || [];
  const relevantRules = orderedRules.filter((rule) => {
    if (rule.actionKey !== "*" && rule.actionKey !== input.action.key) return false;
    if (rule.subjectType === "tenant") return true;
    if (rule.subjectType === "role") return rule.subjectId === input.role;
    if (rule.subjectType === "user") return rule.subjectId === input.userId;
    if (rule.subjectType === "voice_agent") return rule.subjectId === input.voiceAgentId;
    return false;
  });

  for (const rule of relevantRules) {
    matchedRules.push(`${rule.subjectType}:${rule.subjectId}:${rule.effect}`);
    if (rule.effect === "deny") {
      return { allowed: false, requiresApproval: false, reasonCode: "RULE_DENY", matchedRules };
    }
    if (rule.effect === "approval_required") {
      return { allowed: true, requiresApproval: true, reasonCode: "RULE_APPROVAL", matchedRules };
    }
    if (rule.effect === "allow") {
      return { allowed: true, requiresApproval: false, reasonCode: "RULE_ALLOW", matchedRules };
    }
  }

  const requiresApproval =
    input.action.approvalPolicy === "always" ||
    input.action.sensitivity === "restricted" ||
    input.action.sensitivity === "high";

  if (requiresApproval) {
    return {
      allowed: true,
      requiresApproval: true,
      reasonCode: "ACTION_APPROVAL_POLICY",
      matchedRules,
    };
  }

  if (input.action.sensitivity !== "low") {
    return {
      allowed: false,
      requiresApproval: false,
      reasonCode: "EXPLICIT_RULE_REQUIRED",
      matchedRules,
    };
  }

  return { allowed: true, requiresApproval: false, matchedRules };
}
