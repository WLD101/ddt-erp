import { getIntegrationActionDefinition } from "./action-registry";
import { getIntegrationProviderDefinition } from "./registry";
import { evaluateIntegrationPermission } from "./permissions";
import type { TenantIntegrationRecord } from "./types";

export function getAvailableVoiceTools(input: {
  tenantId: string;
  voiceAgentId: string;
  callId: string;
  industryProfileKey?: string | null;
  integrations: TenantIntegrationRecord[];
  permissionsByIntegrationId?: Record<string, Array<{
    subjectType: "tenant" | "role" | "user" | "voice_agent";
    subjectId: string;
    actionKey: string;
    effect: "allow" | "deny" | "approval_required";
  }>>;
}) {
  return input.integrations.flatMap((integration) => {
    const provider = getIntegrationProviderDefinition(integration.providerKey);
    if (!provider.supportsVoiceTools || !provider.capabilities.includes("voice.tools")) {
      return [];
    }

    return provider.supportedActions
      .filter((action) => action.allowedRequestSources.includes("voice_agent"))
      .map((action) => {
        const decision = evaluateIntegrationPermission({
          providerEnabled: provider.status !== "disabled",
          featureEnabled: true,
          planAllowed: true,
          requestSource: "voice_agent",
          integration,
          action,
          industryProfileKey: input.industryProfileKey,
          grantedScopes: integration.grantedScopes,
          rules: input.permissionsByIntegrationId?.[integration.id],
          voiceAgentId: input.voiceAgentId,
        });

        if (!decision.allowed) {
          return null;
        }

        return {
          key: `${integration.providerKey}.${action.key}`,
          actionKey: action.key,
          providerKey: integration.providerKey,
          tenantIntegrationId: integration.id,
          requiresApproval: decision.requiresApproval,
          description: action.description,
        };
      })
      .filter(Boolean);
  });
}
