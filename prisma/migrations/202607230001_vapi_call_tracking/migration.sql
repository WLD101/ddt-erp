ALTER TABLE "VoiceLead"
ADD COLUMN "providerCallId" TEXT,
ADD COLUMN "outcomeKey" TEXT;

ALTER TABLE "VoiceReservationRequest"
ADD COLUMN "outcomeKey" TEXT;

ALTER TABLE "VoiceOrderRequest"
ADD COLUMN "outcomeKey" TEXT;

ALTER TABLE "VoiceCallLog"
ADD COLUMN "externalCallKey" TEXT,
ADD COLUMN "providerStatus" TEXT,
ADD COLUMN "callOutcome" TEXT,
ADD COLUMN "fromNumberMasked" TEXT,
ADD COLUMN "toNumberMasked" TEXT,
ADD COLUMN "ringingAt" TIMESTAMP(3),
ADD COLUMN "answeredAt" TIMESTAMP(3),
ADD COLUMN "lastEventAt" TIMESTAMP(3),
ADD COLUMN "totalDurationSeconds" INTEGER,
ADD COLUMN "ringDurationSeconds" INTEGER,
ADD COLUMN "conversationDurationSeconds" INTEGER,
ADD COLUMN "billableDurationSeconds" INTEGER,
ADD COLUMN "providerActualCostUsd" DOUBLE PRECISION,
ADD COLUMN "providerEstimatedCostUsd" DOUBLE PRECISION,
ADD COLUMN "customerBillableCost" DOUBLE PRECISION,
ADD COLUMN "billingCurrency" TEXT,
ADD COLUMN "structuredDataJson" TEXT,
ADD COLUMN "successEvaluation" TEXT,
ADD COLUMN "transcriptStatus" TEXT NOT NULL DEFAULT 'not_available',
ADD COLUMN "analysisStatus" TEXT NOT NULL DEFAULT 'not_available',
ADD COLUMN "reconciliationStatus" TEXT NOT NULL DEFAULT 'not_checked',
ADD COLUMN "reconciliationDiscrepancyJson" TEXT,
ADD COLUMN "providerSyncedAt" TIMESTAMP(3),
ADD COLUMN "activeSlotAcquiredAt" TIMESTAMP(3),
ADD COLUMN "activeSlotReleasedAt" TIMESTAMP(3),
ADD COLUMN "walletChargedAt" TIMESTAMP(3),
ADD COLUMN "isAnswered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isFailed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isAbandoned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isVoicemail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "transferRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "transferConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "transferFailed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isTransferred" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isQualified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requiresFollowUp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isTestCall" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "VoiceWebhookEvent"
ADD COLUMN "encryptedPayload" TEXT,
ADD COLUMN "payloadHash" TEXT,
ADD COLUMN "deduplicationKey" TEXT,
ADD COLUMN "lastErrorCode" TEXT,
ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "duplicateCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "correlationId" TEXT,
ADD COLUMN "leaseOwner" TEXT,
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN "deadLetteredAt" TIMESTAMP(3);

-- Backfill identities only where the historical provider/call pair is already unique.
WITH unique_calls AS (
  SELECT LOWER("provider") AS provider_key, "providerCallId"
  FROM "VoiceCallLog"
  WHERE "provider" IS NOT NULL AND "providerCallId" IS NOT NULL
  GROUP BY LOWER("provider"), "providerCallId"
  HAVING COUNT(*) = 1
)
UPDATE "VoiceCallLog" AS log
SET "externalCallKey" = LOWER(log."provider") || ':' || log."providerCallId"
FROM unique_calls
WHERE LOWER(log."provider") = unique_calls.provider_key
  AND log."providerCallId" = unique_calls."providerCallId";

CREATE UNIQUE INDEX "VoiceLead_outcomeKey_key" ON "VoiceLead"("outcomeKey");
CREATE INDEX "VoiceLead_providerCallId_idx" ON "VoiceLead"("providerCallId");
CREATE UNIQUE INDEX "VoiceReservationRequest_outcomeKey_key" ON "VoiceReservationRequest"("outcomeKey");
CREATE INDEX "VoiceReservationRequest_providerCallId_idx" ON "VoiceReservationRequest"("providerCallId");
CREATE UNIQUE INDEX "VoiceOrderRequest_outcomeKey_key" ON "VoiceOrderRequest"("outcomeKey");
CREATE INDEX "VoiceOrderRequest_providerCallId_idx" ON "VoiceOrderRequest"("providerCallId");

CREATE UNIQUE INDEX "VoiceCallLog_externalCallKey_key" ON "VoiceCallLog"("externalCallKey");
CREATE INDEX "VoiceCallLog_provider_providerCallId_idx" ON "VoiceCallLog"("provider", "providerCallId");
CREATE INDEX "VoiceCallLog_providerPhoneNumberId_idx" ON "VoiceCallLog"("providerPhoneNumberId");
CREATE INDEX "VoiceCallLog_providerAssistantId_idx" ON "VoiceCallLog"("providerAssistantId");
CREATE INDEX "VoiceCallLog_organizationId_callDirection_createdAt_idx" ON "VoiceCallLog"("organizationId", "callDirection", "createdAt" DESC);
CREATE INDEX "VoiceCallLog_organizationId_isMissed_createdAt_idx" ON "VoiceCallLog"("organizationId", "isMissed", "createdAt" DESC);
CREATE INDEX "VoiceCallLog_org_reconciliation_createdAt_idx" ON "VoiceCallLog"("organizationId", "reconciliationStatus", "createdAt" DESC);

CREATE UNIQUE INDEX "VoiceWebhookEvent_deduplicationKey_key" ON "VoiceWebhookEvent"("deduplicationKey");
CREATE INDEX "VoiceWebhookEvent_status_nextAttemptAt_idx" ON "VoiceWebhookEvent"("status", "nextAttemptAt");
CREATE INDEX "VoiceWebhookEvent_status_leaseExpiresAt_idx" ON "VoiceWebhookEvent"("status", "leaseExpiresAt");
