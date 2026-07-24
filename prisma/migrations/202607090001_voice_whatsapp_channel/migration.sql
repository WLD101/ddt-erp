-- WhatsQuery Voice WhatsApp channel foundation.
-- Additive only: creates tenant-scoped WhatsApp integration/conversation/message tables.

CREATE TABLE "VoiceWhatsappIntegration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "voiceAgentId" TEXT,
    "whatsappBusinessAccountId" TEXT,
    "phoneNumberId" TEXT NOT NULL,
    "phoneNumberDisplayName" TEXT,
    "accessTokenEncrypted" TEXT,
    "webhookVerifyTokenHash" TEXT,
    "webhookStatus" TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
    "status" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "staffNotificationNumber" TEXT,
    "templateSettingsJson" TEXT,
    "lastWebhookAt" TIMESTAMP(3),
    "lastInboundMessageAt" TIMESTAMP(3),
    "lastOutboundMessageAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VoiceWhatsappIntegration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceWhatsappConversation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "voiceAgentId" TEXT,
    "contactWaId" TEXT NOT NULL,
    "contactName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "language" TEXT,
    "lastMessagePreview" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "handoffRequested" BOOLEAN NOT NULL DEFAULT false,
    "leadCreated" BOOLEAN NOT NULL DEFAULT false,
    "orderRequested" BOOLEAN NOT NULL DEFAULT false,
    "appointmentRequested" BOOLEAN NOT NULL DEFAULT false,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VoiceWhatsappConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceWhatsappMessage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiIntent" TEXT,
    "rawPayloadJson" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VoiceWhatsappMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceWhatsappTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "body" TEXT NOT NULL,
    "providerTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VoiceWhatsappTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceWhatsappNotificationLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT,
    "conversationId" TEXT,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "destination" TEXT,
    "message" TEXT,
    "errorMessage" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoiceWhatsappNotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceWhatsappIntegration_phoneNumberId_key" ON "VoiceWhatsappIntegration"("phoneNumberId");
CREATE INDEX "VoiceWhatsappIntegration_organizationId_idx" ON "VoiceWhatsappIntegration"("organizationId");
CREATE INDEX "VoiceWhatsappIntegration_voiceAgentId_idx" ON "VoiceWhatsappIntegration"("voiceAgentId");
CREATE INDEX "VoiceWhatsappIntegration_status_idx" ON "VoiceWhatsappIntegration"("status");
CREATE INDEX "VoiceWhatsappIntegration_isEnabled_idx" ON "VoiceWhatsappIntegration"("isEnabled");

CREATE UNIQUE INDEX "VoiceWhatsappConversation_integrationId_contactWaId_key" ON "VoiceWhatsappConversation"("integrationId", "contactWaId");
CREATE UNIQUE INDEX "VoiceWhatsappConversation_id_organizationId_key" ON "VoiceWhatsappConversation"("id", "organizationId");
CREATE INDEX "VoiceWhatsappConversation_organizationId_lastMessageAt_idx" ON "VoiceWhatsappConversation"("organizationId", "lastMessageAt" DESC);
CREATE INDEX "VoiceWhatsappConversation_voiceAgentId_idx" ON "VoiceWhatsappConversation"("voiceAgentId");
CREATE INDEX "VoiceWhatsappConversation_status_idx" ON "VoiceWhatsappConversation"("status");

CREATE UNIQUE INDEX "VoiceWhatsappMessage_providerMessageId_key" ON "VoiceWhatsappMessage"("providerMessageId");
CREATE UNIQUE INDEX "VoiceWhatsappMessage_id_organizationId_key" ON "VoiceWhatsappMessage"("id", "organizationId");
CREATE INDEX "VoiceWhatsappMessage_organizationId_createdAt_idx" ON "VoiceWhatsappMessage"("organizationId", "createdAt" DESC);
CREATE INDEX "VoiceWhatsappMessage_integrationId_idx" ON "VoiceWhatsappMessage"("integrationId");
CREATE INDEX "VoiceWhatsappMessage_conversationId_createdAt_idx" ON "VoiceWhatsappMessage"("conversationId", "createdAt");
CREATE INDEX "VoiceWhatsappMessage_direction_idx" ON "VoiceWhatsappMessage"("direction");
CREATE INDEX "VoiceWhatsappMessage_status_idx" ON "VoiceWhatsappMessage"("status");

CREATE UNIQUE INDEX "VoiceWhatsappTemplate_organizationId_name_language_key" ON "VoiceWhatsappTemplate"("organizationId", "name", "language");
CREATE INDEX "VoiceWhatsappTemplate_organizationId_idx" ON "VoiceWhatsappTemplate"("organizationId");
CREATE INDEX "VoiceWhatsappTemplate_integrationId_idx" ON "VoiceWhatsappTemplate"("integrationId");
CREATE INDEX "VoiceWhatsappTemplate_status_idx" ON "VoiceWhatsappTemplate"("status");

CREATE INDEX "VoiceWhatsappNotificationLog_organizationId_createdAt_idx" ON "VoiceWhatsappNotificationLog"("organizationId", "createdAt" DESC);
CREATE INDEX "VoiceWhatsappNotificationLog_integrationId_idx" ON "VoiceWhatsappNotificationLog"("integrationId");
CREATE INDEX "VoiceWhatsappNotificationLog_conversationId_idx" ON "VoiceWhatsappNotificationLog"("conversationId");
CREATE INDEX "VoiceWhatsappNotificationLog_status_idx" ON "VoiceWhatsappNotificationLog"("status");

ALTER TABLE "VoiceWhatsappIntegration" ADD CONSTRAINT "VoiceWhatsappIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappIntegration" ADD CONSTRAINT "VoiceWhatsappIntegration_voiceAgentId_fkey" FOREIGN KEY ("voiceAgentId") REFERENCES "VoiceAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappConversation" ADD CONSTRAINT "VoiceWhatsappConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappConversation" ADD CONSTRAINT "VoiceWhatsappConversation_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "VoiceWhatsappIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappConversation" ADD CONSTRAINT "VoiceWhatsappConversation_voiceAgentId_fkey" FOREIGN KEY ("voiceAgentId") REFERENCES "VoiceAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappMessage" ADD CONSTRAINT "VoiceWhatsappMessage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappMessage" ADD CONSTRAINT "VoiceWhatsappMessage_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "VoiceWhatsappIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappMessage" ADD CONSTRAINT "VoiceWhatsappMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "VoiceWhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappTemplate" ADD CONSTRAINT "VoiceWhatsappTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappTemplate" ADD CONSTRAINT "VoiceWhatsappTemplate_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "VoiceWhatsappIntegration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappNotificationLog" ADD CONSTRAINT "VoiceWhatsappNotificationLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappNotificationLog" ADD CONSTRAINT "VoiceWhatsappNotificationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "VoiceWhatsappIntegration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VoiceWhatsappNotificationLog" ADD CONSTRAINT "VoiceWhatsappNotificationLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "VoiceWhatsappConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
