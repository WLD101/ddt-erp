-- Shared integration foundation
CREATE TABLE "IntegrationProvider" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "key" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'development',
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "minimumPlan" TEXT,
  "configuration" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantIntegration" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT,
  "providerKey" TEXT NOT NULL,
  "connectionName" TEXT NOT NULL,
  "externalAccountId" TEXT,
  "externalAccountName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "healthStatus" TEXT NOT NULL DEFAULT 'unknown',
  "encryptedCredentials" TEXT,
  "credentialVersion" INTEGER NOT NULL DEFAULT 1,
  "grantedScopes" TEXT,
  "selectedResources" TEXT,
  "configuration" TEXT,
  "fieldMappings" TEXT,
  "lastConnectedAt" TIMESTAMP(3),
  "lastTestedAt" TIMESTAMP(3),
  "lastSuccessfulAt" TIMESTAMP(3),
  "lastSyncAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantIntegration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationResource" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "metadata" TEXT,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationPermission" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "actionKey" TEXT NOT NULL,
  "effect" TEXT NOT NULL,
  "approvalMode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationSyncJob" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "cursor" TEXT,
  "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
  "recordsSucceeded" INTEGER NOT NULL DEFAULT 0,
  "recordsFailed" INTEGER NOT NULL DEFAULT 0,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "heartbeatAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "errorCode" TEXT,
  "errorSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationSyncJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "externalEventId" TEXT,
  "deduplicationKey" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'received',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  CONSTRAINT "IntegrationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationActionLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "actionKey" TEXT NOT NULL,
  "requestSource" TEXT NOT NULL,
  "userId" TEXT,
  "voiceAgentId" TEXT,
  "callId" TEXT,
  "correlationId" TEXT NOT NULL,
  "requestPayloadRedacted" TEXT,
  "responsePayloadRedacted" TEXT,
  "status" TEXT NOT NULL,
  "errorCode" TEXT,
  "durationMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationActionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationApprovalRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "actionKey" TEXT NOT NULL,
  "requestSource" TEXT NOT NULL,
  "requestedBy" TEXT,
  "voiceAgentId" TEXT,
  "callId" TEXT,
  "payload" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationHealthCheck" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "latencyMs" INTEGER,
  "scopeStatus" TEXT,
  "credentialStatus" TEXT,
  "resourceStatus" TEXT,
  "webhookStatus" TEXT,
  "errorCode" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationHealthCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationFieldMapping" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "externalEntity" TEXT NOT NULL,
  "externalField" TEXT NOT NULL,
  "internalEntity" TEXT NOT NULL,
  "internalField" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "transformation" TEXT,
  "defaultValue" TEXT,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationFieldMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationUsageRecord" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "periodKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationUsageRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationOAuthState" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "stateId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "redirectPath" TEXT NOT NULL,
  "codeVerifierEncrypted" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationOAuthState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationWebhookEndpoint" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "secretEncrypted" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "events" TEXT,
  "lastDeliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationWebhookEndpoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationWebhookDelivery" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "integrationWebhookEndpointId" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "payloadRedacted" TEXT,
  "responseCode" INTEGER,
  "responseBodyRedacted" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attemptedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationWebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationProvider_organizationId_key_key" ON "IntegrationProvider"("organizationId", "key");
CREATE INDEX "IntegrationProvider_key_idx" ON "IntegrationProvider"("key");
CREATE INDEX "IntegrationProvider_organizationId_key_idx" ON "IntegrationProvider"("organizationId", "key");

CREATE UNIQUE INDEX "TenantIntegration_organizationId_providerKey_connectionName_key" ON "TenantIntegration"("organizationId", "providerKey", "connectionName");
CREATE INDEX "TenantIntegration_organizationId_providerKey_idx" ON "TenantIntegration"("organizationId", "providerKey");
CREATE INDEX "TenantIntegration_status_idx" ON "TenantIntegration"("status");
CREATE INDEX "TenantIntegration_healthStatus_idx" ON "TenantIntegration"("healthStatus");

CREATE UNIQUE INDEX "IntegrationResource_tenantIntegrationId_resourceType_externalId_key" ON "IntegrationResource"("tenantIntegrationId", "resourceType", "externalId");
CREATE INDEX "IntegrationResource_organizationId_tenantIntegrationId_idx" ON "IntegrationResource"("organizationId", "tenantIntegrationId");

CREATE UNIQUE INDEX "IntegrationPermission_tenantIntegrationId_subjectType_subjectId_actionKey_key" ON "IntegrationPermission"("tenantIntegrationId", "subjectType", "subjectId", "actionKey");
CREATE INDEX "IntegrationPermission_organizationId_tenantIntegrationId_idx" ON "IntegrationPermission"("organizationId", "tenantIntegrationId");

CREATE INDEX "IntegrationSyncJob_organizationId_tenantIntegrationId_status_idx" ON "IntegrationSyncJob"("organizationId", "tenantIntegrationId", "status");
CREATE INDEX "IntegrationSyncJob_status_scheduledAt_idx" ON "IntegrationSyncJob"("status", "scheduledAt");

CREATE UNIQUE INDEX "IntegrationEvent_organizationId_providerKey_deduplicationKey_key" ON "IntegrationEvent"("organizationId", "providerKey", "deduplicationKey");
CREATE INDEX "IntegrationEvent_organizationId_tenantIntegrationId_receivedAt_idx" ON "IntegrationEvent"("organizationId", "tenantIntegrationId", "receivedAt");

CREATE INDEX "IntegrationActionLog_organizationId_tenantIntegrationId_createdAt_idx" ON "IntegrationActionLog"("organizationId", "tenantIntegrationId", "createdAt");
CREATE INDEX "IntegrationActionLog_organizationId_actionKey_createdAt_idx" ON "IntegrationActionLog"("organizationId", "actionKey", "createdAt");

CREATE INDEX "IntegrationApprovalRequest_organizationId_tenantIntegrationId_status_idx" ON "IntegrationApprovalRequest"("organizationId", "tenantIntegrationId", "status");
CREATE INDEX "IntegrationApprovalRequest_status_expiresAt_idx" ON "IntegrationApprovalRequest"("status", "expiresAt");

CREATE INDEX "IntegrationHealthCheck_organizationId_tenantIntegrationId_checkedAt_idx" ON "IntegrationHealthCheck"("organizationId", "tenantIntegrationId", "checkedAt");

CREATE UNIQUE INDEX "IntegrationFieldMapping_tenantIntegrationId_externalEntity_externalField_internalEntity_internalField_direction_key" ON "IntegrationFieldMapping"("tenantIntegrationId", "externalEntity", "externalField", "internalEntity", "internalField", "direction");
CREATE INDEX "IntegrationFieldMapping_organizationId_tenantIntegrationId_idx" ON "IntegrationFieldMapping"("organizationId", "tenantIntegrationId");

CREATE INDEX "IntegrationUsageRecord_organizationId_tenantIntegrationId_metric_periodKey_idx" ON "IntegrationUsageRecord"("organizationId", "tenantIntegrationId", "metric", "periodKey");

CREATE UNIQUE INDEX "IntegrationOAuthState_stateId_key" ON "IntegrationOAuthState"("stateId");
CREATE INDEX "IntegrationOAuthState_organizationId_providerKey_expiresAt_idx" ON "IntegrationOAuthState"("organizationId", "providerKey", "expiresAt");

CREATE INDEX "IntegrationWebhookEndpoint_organizationId_providerKey_idx" ON "IntegrationWebhookEndpoint"("organizationId", "providerKey");
CREATE UNIQUE INDEX "IntegrationWebhookDelivery_deliveryId_key" ON "IntegrationWebhookDelivery"("deliveryId");
CREATE INDEX "IntegrationWebhookDelivery_organizationId_status_createdAt_idx" ON "IntegrationWebhookDelivery"("organizationId", "status", "createdAt");

ALTER TABLE "IntegrationProvider" ADD CONSTRAINT "IntegrationProvider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantIntegration" ADD CONSTRAINT "TenantIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantIntegration" ADD CONSTRAINT "TenantIntegration_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IntegrationResource" ADD CONSTRAINT "IntegrationResource_tenantIntegrationId_fkey" FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationPermission" ADD CONSTRAINT "IntegrationPermission_tenantIntegrationId_fkey" FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationSyncJob" ADD CONSTRAINT "IntegrationSyncJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationSyncJob" ADD CONSTRAINT "IntegrationSyncJob_tenantIntegrationId_fkey" FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_tenantIntegrationId_fkey" FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationActionLog" ADD CONSTRAINT "IntegrationActionLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationActionLog" ADD CONSTRAINT "IntegrationActionLog_tenantIntegrationId_fkey" FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationApprovalRequest" ADD CONSTRAINT "IntegrationApprovalRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationApprovalRequest" ADD CONSTRAINT "IntegrationApprovalRequest_tenantIntegrationId_fkey" FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationHealthCheck" ADD CONSTRAINT "IntegrationHealthCheck_tenantIntegrationId_fkey" FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationFieldMapping" ADD CONSTRAINT "IntegrationFieldMapping_tenantIntegrationId_fkey" FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationUsageRecord" ADD CONSTRAINT "IntegrationUsageRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationUsageRecord" ADD CONSTRAINT "IntegrationUsageRecord_tenantIntegrationId_fkey" FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationOAuthState" ADD CONSTRAINT "IntegrationOAuthState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationWebhookEndpoint" ADD CONSTRAINT "IntegrationWebhookEndpoint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationWebhookDelivery" ADD CONSTRAINT "IntegrationWebhookDelivery_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationWebhookDelivery" ADD CONSTRAINT "IntegrationWebhookDelivery_integrationWebhookEndpointId_fkey" FOREIGN KEY ("integrationWebhookEndpointId") REFERENCES "IntegrationWebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
