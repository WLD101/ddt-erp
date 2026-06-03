ALTER TABLE "VoiceIntegrationSettings"
ADD COLUMN "vapiAssistantId" TEXT,
ADD COLUMN "vapiAssistantName" TEXT,
ADD COLUMN "vapiPhoneNumberId" TEXT,
ADD COLUMN "vapiWebhookUrl" TEXT,
ADD COLUMN "lastWebhookAt" TIMESTAMP(3),
ADD COLUMN "lastWebhookType" TEXT;

CREATE INDEX "VoiceIntegrationSettings_vapiAssistantId_idx" ON "VoiceIntegrationSettings"("vapiAssistantId");
CREATE INDEX "VoiceIntegrationSettings_vapiPhoneNumberId_idx" ON "VoiceIntegrationSettings"("vapiPhoneNumberId");
