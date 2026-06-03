-- Additive multi-agent mapping for WhatsQuery Voice.
-- This creates tenant-scoped VoiceAgent records and links existing Voice leads/call logs to agents.
-- It does not modify ERP Smart Assistant or ERP business data tables.

CREATE TABLE "VoiceAgent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessProfileId" TEXT,
    "trainingProfileId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AI_RECEPTIONIST',
    "languageMode" TEXT NOT NULL DEFAULT 'AUTO_DETECT',
    "supportedLanguages" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "voicePersona" TEXT,
    "allowedTools" TEXT,
    "vapiAssistantId" TEXT,
    "vapiAssistantName" TEXT,
    "vapiPhoneNumberId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPromptSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceAgent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "VoiceLead"
ADD COLUMN "voiceAgentId" TEXT;

ALTER TABLE "VoiceCallLog"
ADD COLUMN "voiceAgentId" TEXT;

CREATE UNIQUE INDEX "VoiceAgent_organizationId_name_key" ON "VoiceAgent"("organizationId", "name");
CREATE INDEX "VoiceAgent_organizationId_isDefault_idx" ON "VoiceAgent"("organizationId", "isDefault");
CREATE INDEX "VoiceAgent_organizationId_isActive_idx" ON "VoiceAgent"("organizationId", "isActive");
CREATE INDEX "VoiceAgent_vapiAssistantId_idx" ON "VoiceAgent"("vapiAssistantId");
CREATE INDEX "VoiceAgent_vapiPhoneNumberId_idx" ON "VoiceAgent"("vapiPhoneNumberId");
CREATE INDEX "VoiceLead_voiceAgentId_idx" ON "VoiceLead"("voiceAgentId");
CREATE INDEX "VoiceCallLog_voiceAgentId_idx" ON "VoiceCallLog"("voiceAgentId");

ALTER TABLE "VoiceAgent"
ADD CONSTRAINT "VoiceAgent_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceAgent"
ADD CONSTRAINT "VoiceAgent_businessProfileId_fkey"
FOREIGN KEY ("businessProfileId") REFERENCES "VoiceBusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VoiceAgent"
ADD CONSTRAINT "VoiceAgent_trainingProfileId_fkey"
FOREIGN KEY ("trainingProfileId") REFERENCES "VoiceBusinessTrainingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VoiceLead"
ADD CONSTRAINT "VoiceLead_voiceAgentId_fkey"
FOREIGN KEY ("voiceAgentId") REFERENCES "VoiceAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VoiceCallLog"
ADD CONSTRAINT "VoiceCallLog_voiceAgentId_fkey"
FOREIGN KEY ("voiceAgentId") REFERENCES "VoiceAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
