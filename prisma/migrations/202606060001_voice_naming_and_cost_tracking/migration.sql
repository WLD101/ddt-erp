-- Add tenant-safe naming and cost-tracking fields for WhatsQuery Voice.

ALTER TABLE "VoiceAgent"
ADD COLUMN "internalName" TEXT,
ADD COLUMN "displayName" TEXT,
ADD COLUMN "businessSlug" TEXT,
ADD COLUMN "agentSlug" TEXT,
ADD COLUMN "environment" TEXT NOT NULL DEFAULT 'PROD',
ADD COLUMN "vapiPhoneNumberName" TEXT,
ADD COLUMN "vapiVoiceId" TEXT;

ALTER TABLE "VoiceCallLog"
ADD COLUMN "voiceBusinessProfileId" TEXT,
ADD COLUMN "costUsd" DOUBLE PRECISION,
ADD COLUMN "costBreakdownJson" TEXT;

ALTER TABLE "VoiceUsageMeter"
ADD COLUMN "callCostUsdToday" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "callCostUsdThisMonth" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX "VoiceAgent_internalName_idx" ON "VoiceAgent"("internalName");
CREATE INDEX "VoiceAgent_businessSlug_idx" ON "VoiceAgent"("businessSlug");
CREATE INDEX "VoiceAgent_agentSlug_idx" ON "VoiceAgent"("agentSlug");
CREATE INDEX "VoiceCallLog_voiceBusinessProfileId_idx" ON "VoiceCallLog"("voiceBusinessProfileId");

ALTER TABLE "VoiceCallLog"
ADD CONSTRAINT "VoiceCallLog_voiceBusinessProfileId_fkey"
FOREIGN KEY ("voiceBusinessProfileId") REFERENCES "VoiceBusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
