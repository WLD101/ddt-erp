const ORGANIZATION_SCOPED_MODELS = new Set([
  "AccountTransfer",
  "AnalyticsEvent",
  "AuditLog",
  "AuthChallenge",
  "BOM",
  "Branch",
  "Category",
  "Customer",
  "CustomerLoyalty",
  "DyeingBatch",
  "EmailLog",
  "Expense",
  "ExportRequest",
  "ExternalOrderMap",
  "ExternalProductMap",
  "FabricLot",
  "FinancialAccount",
  "ImportJob",
  "IntegrationActionExecution",
  "IntegrationActionLog",
  "IntegrationApprovalRequest",
  "IntegrationEvent",
  "IntegrationFieldMapping",
  "IntegrationHealthCheck",
  "IntegrationOAuthState",
  "IntegrationPermission",
  "IntegrationProvider",
  "IntegrationRateLimitCounter",
  "IntegrationResource",
  "IntegrationSyncJob",
  "IntegrationUsageRecord",
  "IntegrationWebhookDelivery",
  "IntegrationWebhookEndpoint",
  "InventoryItem",
  "Invitation",
  "KnowledgeBase",
  "LedgerEntry",
  "Machine",
  "Notification",
  "OnboardingState",
  "OnboardingTask",
  "OrganizationPackage",
  "OrganizationSecurityPolicy",
  "OrganizationUser",
  "Payment",
  "POSRegister",
  "POSReturn",
  "POSSale",
  "Product",
  "ProductionLog",
  "PurchaseInvoice",
  "PurchaseReturn",
  "QualityCheck",
  "Quotation",
  "Role",
  "SalesChannel",
  "SalesChannelSyncLog",
  "SalesInvoice",
  "SalesReturn",
  "SecurityEvent",
  "StitchingBatch",
  "StockMovement",
  "StripeWebhookEvent",
  "Subscription",
  "Supplier",
  "SupportRequest",
  "TelecomActivationControl",
  "TelecomAllowedDestination",
  "TelecomOperationalAlert",
  "TelecomUsageLedger",
  "TenantIntegration",
  "TextileJobCard",
  "TextileOrder",
  "TrustedDevice",
  "VoiceActionAuditLog",
  "VoiceAgent",
  "VoiceAllowedActionPolicy",
  "VoiceBookingRules",
  "VoiceBusinessProfile",
  "VoiceBusinessTrainingProfile",
  "VoiceCallLog",
  "VoiceHandoffRules",
  "VoiceIntegrationSettings",
  "VoiceJob",
  "VoiceKnowledgeBaseItem",
  "VoiceLead",
  "VoiceNotificationLog",
  "VoiceOrderRequest",
  "VoiceOrderRules",
  "VoiceReceptionistSettings",
  "VoiceReservationRequest",
  "VoiceServiceItem",
  "VoiceUsageMeter",
  "VoiceWebhookEvent",
  "VoiceWhatsappConversation",
  "VoiceWhatsappIntegration",
  "VoiceWhatsappMessage",
  "VoiceWhatsappNotificationLog",
  "VoiceWhatsappTemplate",
  "WorkOrder",
  "WorkOrderMaterial",
  "YarnInventory",
]);

const TENANT_ID_SCOPED_MODELS = new Set([
  "Call",
  "CallAttempt",
  "CallEvent",
  "CallLog",
  "CallRoute",
  "CostLedger",
  "CountryRoutingRule",
  "PhoneNumber",
  "ProviderMapping",
  "TelecomWebhookNonce",
]);

const FILTERED_OPERATIONS = new Set([
  "aggregate",
  "count",
  "delete",
  "deleteMany",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
]);

const UPDATED_OPERATIONS = new Set([
  "update",
  "updateMany",
  "updateManyAndReturn",
]);

type TenantScopedArgs = Record<string, unknown>;

function getScopeField(model: string): "organizationId" | "tenantId" | undefined {
  if (ORGANIZATION_SCOPED_MODELS.has(model)) {
    return "organizationId";
  }

  if (TENANT_ID_SCOPED_MODELS.has(model)) {
    return "tenantId";
  }

  return undefined;
}

function scopeData(
  data: unknown,
  scopeField: "organizationId" | "tenantId",
  tenantId: string,
): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => scopeData(item, scopeField, tenantId));
  }

  if (!data || typeof data !== "object") {
    return data;
  }

  return {
    ...(data as Record<string, unknown>),
    [scopeField]: tenantId,
  };
}

export function scopeTenantOperationArgs(
  model: string,
  operation: string,
  args: TenantScopedArgs | undefined,
  tenantId: string,
): TenantScopedArgs | undefined {
  const scopeField = getScopeField(model);
  if (!scopeField) {
    return args;
  }

  const scopedArgs: TenantScopedArgs = { ...(args ?? {}) };

  if (FILTERED_OPERATIONS.has(operation)) {
    scopedArgs.where = {
      ...((args?.where as Record<string, unknown> | undefined) ?? {}),
      [scopeField]: tenantId,
    };
  }

  if (operation === "create") {
    scopedArgs.data = scopeData(args?.data, scopeField, tenantId);
  }

  if (operation === "createMany" || operation === "createManyAndReturn") {
    scopedArgs.data = scopeData(args?.data, scopeField, tenantId);
  }

  if (UPDATED_OPERATIONS.has(operation)) {
    scopedArgs.data = scopeData(args?.data, scopeField, tenantId);
  }

  if (operation === "upsert") {
    scopedArgs.create = scopeData(args?.create, scopeField, tenantId);
    scopedArgs.update = scopeData(args?.update, scopeField, tenantId);
  }

  return scopedArgs;
}

export function getTenantScopeField(
  model: string,
): "organizationId" | "tenantId" | undefined {
  return getScopeField(model);
}

