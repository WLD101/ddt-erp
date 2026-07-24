ALTER TABLE "TenantIntegration"
ADD COLUMN "lastHealthCheckAt" TIMESTAMP(3),
ADD COLUMN "credentialCheckedAt" TIMESTAMP(3),
ADD COLUMN "refreshLeaseOwner" TEXT,
ADD COLUMN "refreshLeaseExpiresAt" TIMESTAMP(3);

ALTER TABLE "IntegrationSyncJob"
ADD COLUMN "leaseOwner" TEXT,
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN "lastErrorAt" TIMESTAMP(3),
ADD COLUMN "cancelRequestedAt" TIMESTAMP(3);

ALTER TABLE "IntegrationEvent"
ADD COLUMN "leaseOwner" TEXT,
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN "deadLetteredAt" TIMESTAMP(3),
ADD COLUMN "processingNotes" TEXT;

CREATE TABLE "IntegrationActionExecution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "actionKey" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "requestSource" TEXT NOT NULL,
  "userId" TEXT,
  "voiceAgentId" TEXT,
  "callId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'running',
  "safeResultRedacted" TEXT,
  "errorCode" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationActionExecution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationActionExecution_organizationId_tenantIntegrationId_idempotencyKey_key"
ON "IntegrationActionExecution"("organizationId", "tenantIntegrationId", "idempotencyKey");

CREATE INDEX "IntegrationActionExecution_organizationId_providerKey_actionKey_status_idx"
ON "IntegrationActionExecution"("organizationId", "providerKey", "actionKey", "status");

CREATE INDEX "IntegrationActionExecution_organizationId_expiresAt_idx"
ON "IntegrationActionExecution"("organizationId", "expiresAt");

ALTER TABLE "IntegrationActionExecution"
ADD CONSTRAINT "IntegrationActionExecution_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntegrationActionExecution"
ADD CONSTRAINT "IntegrationActionExecution_tenantIntegrationId_fkey"
FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "IntegrationRateLimitCounter" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantIntegrationId" TEXT,
  "providerKey" TEXT NOT NULL,
  "actionKey" TEXT,
  "bucketKey" TEXT NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "windowEndsAt" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationRateLimitCounter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationRateLimitCounter_organizationId_bucketKey_key"
ON "IntegrationRateLimitCounter"("organizationId", "bucketKey");

CREATE INDEX "IntegrationRateLimitCounter_organizationId_providerKey_windowStartedAt_idx"
ON "IntegrationRateLimitCounter"("organizationId", "providerKey", "windowStartedAt");

CREATE INDEX "IntegrationRateLimitCounter_windowEndsAt_idx"
ON "IntegrationRateLimitCounter"("windowEndsAt");

ALTER TABLE "IntegrationRateLimitCounter"
ADD CONSTRAINT "IntegrationRateLimitCounter_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntegrationRateLimitCounter"
ADD CONSTRAINT "IntegrationRateLimitCounter_tenantIntegrationId_fkey"
FOREIGN KEY ("tenantIntegrationId") REFERENCES "TenantIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
