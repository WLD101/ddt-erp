import { z } from "zod";

import {
  INDUSTRY_PROFILES,
  industryCapabilityKeys,
  industryProfileKeySchema,
  type IndustryCapabilityKey,
  type IndustryProfileKey,
  type RecommendationLevel,
} from "@/modules/onboarding/industry-profiles";

export const integrationCategories = [
  "calendar",
  "contacts",
  "email",
  "crm",
  "messaging",
  "data",
  "files",
  "payments",
  "automation",
  "developer_tools",
  "sales_channel",
] as const;

export const integrationAuthTypes = [
  "oauth2",
  "api_key",
  "basic_auth",
  "bearer_token",
  "internal",
  "webhook_secret",
] as const;

export const integrationProviderStatuses = [
  "active",
  "beta",
  "development",
  "maintenance",
  "disabled",
] as const;

export const integrationConnectionStatuses = [
  "pending",
  "connected",
  "degraded",
  "expired",
  "reconnect_required",
  "failed",
  "disabled",
  "disconnected",
] as const;

export const integrationHealthStatuses = [
  "healthy",
  "degraded",
  "expired",
  "reconnect_required",
  "provider_unavailable",
  "misconfigured",
  "disabled",
  "unknown",
] as const;

export const integrationApprovalStatuses = [
  "pending",
  "approved",
  "rejected",
  "expired",
  "cancelled",
  "executed",
  "execution_failed",
] as const;

export const integrationSyncStatuses = [
  "queued",
  "running",
  "retry_scheduled",
  "paused",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
  "abandoned",
] as const;

export const integrationEventStatuses = [
  "received",
  "processing",
  "processed",
  "duplicate",
  "failed",
  "dead_lettered",
] as const;

export const integrationRequestSources = [
  "user",
  "voice_agent",
  "worker",
  "webhook",
  "system",
] as const;

export const integrationPermissionSubjectTypes = [
  "tenant",
  "role",
  "user",
  "voice_agent",
] as const;

export const integrationPermissionEffects = [
  "allow",
  "deny",
  "approval_required",
] as const;

export const integrationApprovalPolicies = [
  "none",
  "tenant_configurable",
  "always",
] as const;

export const integrationActionSensitivities = [
  "low",
  "moderate",
  "high",
  "restricted",
] as const;

export const integrationResourceTypes = [
  "calendar",
  "mailbox",
  "pipeline",
  "phone_number",
  "spreadsheet",
  "workbook",
  "account",
  "webhook_endpoint",
  "dataset",
  "sandbox_record",
] as const;

export const integrationCapabilityKeys = [
  "calendar.read",
  "calendar.write",
  "contacts.read",
  "contacts.write",
  "email.read",
  "email.write",
  "crm.read",
  "crm.write",
  "messaging.send",
  "data.read",
  "data.write",
  "payments.write",
  "developer.webhook",
  "developer.rest",
  "voice.tools",
  "sync.read",
  "sync.write",
  "webhooks.inbound",
  "webhooks.outbound",
  "internal_test.read",
  "internal_test.write",
] as const;

export const integrationRecommendationLevels = [
  "essential",
  "recommended",
  "optional",
  "advanced",
  "not_applicable",
  "coming_soon",
] as const;

export type IntegrationCategory = (typeof integrationCategories)[number];
export type IntegrationAuthType = (typeof integrationAuthTypes)[number];
export type IntegrationProviderStatus = (typeof integrationProviderStatuses)[number];
export type IntegrationConnectionStatus = (typeof integrationConnectionStatuses)[number];
export type IntegrationHealthStatus = (typeof integrationHealthStatuses)[number];
export type IntegrationApprovalStatus = (typeof integrationApprovalStatuses)[number];
export type IntegrationSyncStatus = (typeof integrationSyncStatuses)[number];
export type IntegrationEventStatus = (typeof integrationEventStatuses)[number];
export type IntegrationRequestSource = (typeof integrationRequestSources)[number];
export type IntegrationPermissionSubjectType = (typeof integrationPermissionSubjectTypes)[number];
export type IntegrationPermissionEffect = (typeof integrationPermissionEffects)[number];
export type IntegrationApprovalPolicy = (typeof integrationApprovalPolicies)[number];
export type IntegrationActionSensitivity = (typeof integrationActionSensitivities)[number];
export type IntegrationResourceType = (typeof integrationResourceTypes)[number];
export type IntegrationCapabilityKey = (typeof integrationCapabilityKeys)[number];
export type IntegrationRecommendationLevel = (typeof integrationRecommendationLevels)[number];

export const integrationExecutionContextSchema = z.object({
  tenantId: z.string().min(1),
  branchId: z.string().min(1).optional(),
  tenantIntegrationId: z.string().min(1),
  providerKey: z.string().min(1),
  userId: z.string().min(1).optional(),
  voiceAgentId: z.string().min(1).optional(),
  callId: z.string().min(1).optional(),
  correlationId: z.string().min(1),
  requestSource: z.enum(integrationRequestSources),
  credentials: z.record(z.string(), z.unknown()).optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
  selectedResources: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type IntegrationExecutionContext = z.infer<typeof integrationExecutionContextSchema>;

export const integrationResourceDefinitionSchema = z.object({
  key: z.string().min(1),
  type: z.enum(integrationResourceTypes),
  label: z.string().min(1),
  description: z.string().min(1).optional(),
});

export type IntegrationResourceTypeDefinition = z.infer<typeof integrationResourceDefinitionSchema>;

export const integrationActionRequestSchema = z.object({
  actionKey: z.string().min(1),
  idempotencyKey: z.string().min(1).max(191).optional(),
  resourceId: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type IntegrationActionRequest = z.infer<typeof integrationActionRequestSchema>;

export const integrationActionResultSchema = z.object({
  success: z.boolean(),
  status: z.enum(["completed", "approval_required", "blocked", "failed"]),
  actionKey: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
  approvalRequestId: z.string().min(1).optional(),
  errorCode: z.string().min(1).optional(),
});

export type IntegrationActionResult = z.infer<typeof integrationActionResultSchema>;

export const connectionTestResultSchema = z.object({
  success: z.boolean(),
  message: z.string().min(1),
  latencyMs: z.number().int().min(0).optional(),
  scopes: z.array(z.string()).default([]),
  externalAccountId: z.string().optional(),
  externalAccountName: z.string().optional(),
});

export type ConnectionTestResult = z.infer<typeof connectionTestResultSchema>;

export const resourceQuerySchema = z.object({
  query: z.string().optional(),
  resourceType: z.enum(integrationResourceTypes).optional(),
});

export const resourceResultSchema = z.object({
  items: z.array(
    z.object({
      externalId: z.string().min(1),
      name: z.string().min(1),
      resourceType: z.enum(integrationResourceTypes),
      metadata: z.record(z.string(), z.unknown()).default({}),
    })
  ),
});

export type ResourceQuery = z.infer<typeof resourceQuerySchema>;
export type ResourceResult = z.infer<typeof resourceResultSchema>;

export const integrationSyncRequestSchema = z.object({
  direction: z.enum(["inbound", "outbound"]),
  entityType: z.string().min(1),
  cursor: z.string().optional(),
  dryRun: z.boolean().default(false),
});

export const integrationSyncResultSchema = z.object({
  success: z.boolean(),
  message: z.string().min(1),
  nextCursor: z.string().optional(),
  recordsProcessed: z.number().int().min(0).default(0),
  recordsSucceeded: z.number().int().min(0).default(0),
  recordsFailed: z.number().int().min(0).default(0),
});

export type IntegrationSyncRequest = z.infer<typeof integrationSyncRequestSchema>;
export type IntegrationSyncResult = z.infer<typeof integrationSyncResultSchema>;

export const integrationEventRequestSchema = z.object({
  eventType: z.string().min(1),
  deduplicationKey: z.string().min(1),
  externalEventId: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const integrationEventResultSchema = z.object({
  success: z.boolean(),
  status: z.enum(["processed", "duplicate", "failed"]),
  message: z.string().min(1),
  errorCode: z.string().min(1).optional(),
});

export type IntegrationEventRequest = z.infer<typeof integrationEventRequestSchema>;
export type IntegrationEventResult = z.infer<typeof integrationEventResultSchema>;

export const credentialRefreshResultSchema = z.object({
  success: z.boolean(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  message: z.string().min(1),
});

export type CredentialRefreshResult = z.infer<typeof credentialRefreshResultSchema>;

export const webhookSubscriptionResultSchema = z.object({
  success: z.boolean(),
  message: z.string().min(1),
  externalSubscriptionId: z.string().optional(),
});

export type WebhookSubscriptionResult = z.infer<typeof webhookSubscriptionResultSchema>;

export const integrationActionDefinitionSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  capability: z.enum(integrationCapabilityKeys),
  inputSchema: z.custom<z.ZodTypeAny>(),
  outputSchema: z.custom<z.ZodTypeAny>(),
  requiredProviderScopes: z.array(z.string()).default([]),
  requiredIndustryCapabilities: z.array(z.enum(industryCapabilityKeys)).default([]),
  allowedRequestSources: z.array(z.enum(integrationRequestSources)).min(1),
  sensitivity: z.enum(integrationActionSensitivities),
  confirmationRequired: z.boolean(),
  approvalPolicy: z.enum(integrationApprovalPolicies),
  idempotencyRequired: z.boolean(),
  auditRequired: z.boolean(),
  timeoutMs: z.number().int().positive(),
  retryPolicy: z.string().min(1),
});

export type IntegrationActionDefinition = {
  key: string;
  name: string;
  description: string;
  capability: IntegrationCapabilityKey;
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  requiredProviderScopes?: string[];
  requiredIndustryCapabilities?: IndustryCapabilityKey[];
  allowedRequestSources: IntegrationRequestSource[];
  sensitivity: IntegrationActionSensitivity;
  confirmationRequired: boolean;
  approvalPolicy: IntegrationApprovalPolicy;
  idempotencyRequired: boolean;
  auditRequired: boolean;
  timeoutMs: number;
  retryPolicy: string;
};

export type IntegrationEventDefinition = {
  key: string;
  name: string;
  description: string;
};

export type IntegrationProviderDefinition = {
  key: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  authType: IntegrationAuthType;
  status: IntegrationProviderStatus;
  capabilities: IntegrationCapabilityKey[];
  supportedActions: IntegrationActionDefinition[];
  supportedEvents: IntegrationEventDefinition[];
  requiredScopes?: string[];
  optionalScopes?: string[];
  minimumPlan?: string;
  featureFlag?: string;
  supportedIndustryProfiles?: IndustryProfileKey[];
  recommendedForCapabilities?: IndustryCapabilityKey[];
  excludedCapabilities?: IndustryCapabilityKey[];
  resourceTypes?: IntegrationResourceTypeDefinition[];
  supportsSync: boolean;
  supportsWebhooks: boolean;
  supportsFieldMapping: boolean;
  supportsVoiceTools: boolean;
  connectionSchema?: z.ZodTypeAny;
  configurationSchema?: z.ZodTypeAny;
};

export type IntegrationPermissionDecision = {
  allowed: boolean;
  requiresApproval: boolean;
  reasonCode?: string;
  matchedRules: string[];
};

export type IntegrationProviderCatalogEntry = {
  key: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationProviderStatus;
  implementationState: "working" | "internal_only" | "in_development";
  recommendationLevel: IntegrationRecommendationLevel;
  recommendationReason?: string;
  supportedCapabilities: IntegrationCapabilityKey[];
  canConnect: boolean;
  featureFlag?: string;
};

export type TenantIntegrationRecord = {
  id: string;
  organizationId: string;
  branchId?: string | null;
  providerKey: string;
  connectionName: string;
  externalAccountId?: string | null;
  externalAccountName?: string | null;
  status: IntegrationConnectionStatus;
  healthStatus: IntegrationHealthStatus;
  encryptedCredentials?: string | null;
  credentialVersion: number;
  grantedScopes: string[];
  selectedResources: Record<string, unknown>[];
  configuration: Record<string, unknown>;
  fieldMappings: Record<string, unknown>[];
  lastConnectedAt?: Date | null;
  lastTestedAt?: Date | null;
  lastSuccessfulAt?: Date | null;
  lastSyncAt?: Date | null;
  expiresAt?: Date | null;
  failureCount: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export function toIntegrationRecommendationLevel(level: RecommendationLevel): IntegrationRecommendationLevel {
  switch (level) {
    case "ESSENTIAL":
      return "essential";
    case "RECOMMENDED":
      return "recommended";
    case "OPTIONAL":
      return "optional";
    case "ADVANCED":
      return "advanced";
    case "NOT_APPLICABLE":
      return "not_applicable";
    case "COMING_SOON":
      return "coming_soon";
    default:
      return "optional";
  }
}

export function getIndustryCapabilities(profileKey: IndustryProfileKey | null | undefined): IndustryCapabilityKey[] {
  if (!profileKey) return [];
  return [...INDUSTRY_PROFILES[profileKey].capabilities];
}

export function isSupportedIndustryProfile(profileKey: string): profileKey is IndustryProfileKey {
  return industryProfileKeySchema.safeParse(profileKey).success;
}
