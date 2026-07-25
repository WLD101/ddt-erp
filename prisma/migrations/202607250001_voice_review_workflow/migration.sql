-- Staff-approved Vapi to ERP review workflow domain.
CREATE TABLE "VoiceReviewItem" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "requestType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'captured',
  "version" INTEGER NOT NULL DEFAULT 1,
  "providerCallId" TEXT,
  "voiceAgentId" TEXT,
  "marketKey" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "customerSnapshotJson" TEXT,
  "confirmedFieldsJson" TEXT,
  "inferredFieldsJson" TEXT,
  "unresolvedFieldsJson" TEXT,
  "validationErrorsJson" TEXT,
  "proposedActionJson" TEXT,
  "lastReason" TEXT,
  "assignedToUserId" TEXT,
  "approvedByUserId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VoiceReviewItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceReviewTransition" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "reviewItemId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorRole" TEXT,
  "previousStatus" TEXT,
  "newStatus" TEXT NOT NULL,
  "reason" TEXT,
  "providerCallId" TEXT,
  "requestId" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VoiceReviewTransition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceOutcomeLink" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "reviewItemId" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "outcomeType" TEXT NOT NULL,
  "outcomeId" TEXT,
  "customerId" TEXT,
  "providerCallId" TEXT,
  "approvingUserId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VoiceOutcomeLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceBooking" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "customerId" TEXT,
  "sourceReviewItemId" TEXT,
  "sourceRequestId" TEXT,
  "providerCallId" TEXT,
  "bookingType" TEXT NOT NULL DEFAULT 'APPOINTMENT',
  "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  "scheduledStartAt" TIMESTAMP(3) NOT NULL,
  "scheduledEndAt" TIMESTAMP(3),
  "timezone" TEXT NOT NULL,
  "customerNameSnapshot" TEXT,
  "customerPhoneSnapshot" TEXT,
  "notes" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VoiceBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceReviewItem_organizationId_sourceType_sourceId_key" ON "VoiceReviewItem"("organizationId", "sourceType", "sourceId");
CREATE UNIQUE INDEX "VoiceReviewItem_idempotencyKey_key" ON "VoiceReviewItem"("idempotencyKey");
CREATE INDEX "VoiceReviewItem_organizationId_branchId_status_idx" ON "VoiceReviewItem"("organizationId", "branchId", "status");
CREATE INDEX "VoiceReviewItem_organizationId_requestType_status_idx" ON "VoiceReviewItem"("organizationId", "requestType", "status");

CREATE INDEX "VoiceReviewTransition_organizationId_reviewItemId_createdAt_idx" ON "VoiceReviewTransition"("organizationId", "reviewItemId", "createdAt");
CREATE INDEX "VoiceReviewTransition_organizationId_branchId_createdAt_idx" ON "VoiceReviewTransition"("organizationId", "branchId", "createdAt");

CREATE UNIQUE INDEX "VoiceOutcomeLink_idempotencyKey_key" ON "VoiceOutcomeLink"("idempotencyKey");
CREATE INDEX "VoiceOutcomeLink_organizationId_sourceType_sourceId_idx" ON "VoiceOutcomeLink"("organizationId", "sourceType", "sourceId");
CREATE INDEX "VoiceOutcomeLink_organizationId_outcomeType_outcomeId_idx" ON "VoiceOutcomeLink"("organizationId", "outcomeType", "outcomeId");

CREATE UNIQUE INDEX "VoiceBooking_idempotencyKey_key" ON "VoiceBooking"("idempotencyKey");
CREATE INDEX "VoiceBooking_organizationId_branchId_scheduledStartAt_idx" ON "VoiceBooking"("organizationId", "branchId", "scheduledStartAt");
CREATE INDEX "VoiceBooking_organizationId_sourceRequestId_idx" ON "VoiceBooking"("organizationId", "sourceRequestId");
CREATE INDEX "VoiceBooking_organizationId_status_idx" ON "VoiceBooking"("organizationId", "status");

ALTER TABLE "VoiceReviewItem"
  ADD CONSTRAINT "VoiceReviewItem_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceReviewTransition"
  ADD CONSTRAINT "VoiceReviewTransition_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceOutcomeLink"
  ADD CONSTRAINT "VoiceOutcomeLink_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceBooking"
  ADD CONSTRAINT "VoiceBooking_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
