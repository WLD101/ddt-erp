-- Additive voice receptionist foundation.
-- This creates tenant-scoped tables for the standalone voice.whatsquery.com
-- product without touching the ERP Smart Assistant models.

CREATE TABLE "VoiceBusinessProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "businessPhone" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'AUTO_DETECT',
    "openingHours" TEXT,
    "mainGoal" TEXT NOT NULL,
    "fallbackContactMethod" TEXT,
    "greetingMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceBusinessProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceReceptionistSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "receptionistName" TEXT NOT NULL DEFAULT 'WhatsQuery Receptionist',
    "greetingMessage" TEXT,
    "fallbackMessage" TEXT,
    "languageMode" TEXT NOT NULL DEFAULT 'AUTO_DETECT',
    "businessHours" TEXT,
    "afterHoursBehavior" TEXT NOT NULL DEFAULT 'TAKE_MESSAGE',
    "leadCaptureFields" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceReceptionistSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceLead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "reasonForCall" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "appointmentRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceLead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceCallLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "callerNumber" TEXT NOT NULL,
    "callStatus" TEXT NOT NULL,
    "callDirection" TEXT NOT NULL,
    "summary" TEXT,
    "transcriptPlaceholder" TEXT,
    "durationSeconds" INTEGER,
    "appointmentRequested" BOOLEAN NOT NULL DEFAULT false,
    "isMissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceCallLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceKnowledgeBaseItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceKnowledgeBaseItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceIntegrationSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vapiStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "twilioStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "googleCalendarStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "whatsappFollowUpStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "providerConfigNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceIntegrationSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceBusinessProfile_organizationId_key" ON "VoiceBusinessProfile"("organizationId");
CREATE UNIQUE INDEX "VoiceReceptionistSettings_organizationId_key" ON "VoiceReceptionistSettings"("organizationId");
CREATE UNIQUE INDEX "VoiceLead_id_organizationId_key" ON "VoiceLead"("id", "organizationId");
CREATE UNIQUE INDEX "VoiceCallLog_id_organizationId_key" ON "VoiceCallLog"("id", "organizationId");
CREATE UNIQUE INDEX "VoiceKnowledgeBaseItem_id_organizationId_key" ON "VoiceKnowledgeBaseItem"("id", "organizationId");
CREATE UNIQUE INDEX "VoiceIntegrationSettings_organizationId_key" ON "VoiceIntegrationSettings"("organizationId");

CREATE INDEX "VoiceBusinessProfile_organizationId_idx" ON "VoiceBusinessProfile"("organizationId");
CREATE INDEX "VoiceReceptionistSettings_organizationId_idx" ON "VoiceReceptionistSettings"("organizationId");
CREATE INDEX "VoiceLead_organizationId_createdAt_idx" ON "VoiceLead"("organizationId", "createdAt" DESC);
CREATE INDEX "VoiceCallLog_organizationId_createdAt_idx" ON "VoiceCallLog"("organizationId", "createdAt" DESC);
CREATE INDEX "VoiceKnowledgeBaseItem_organizationId_createdAt_idx" ON "VoiceKnowledgeBaseItem"("organizationId", "createdAt" DESC);
CREATE INDEX "VoiceIntegrationSettings_organizationId_idx" ON "VoiceIntegrationSettings"("organizationId");

ALTER TABLE "VoiceBusinessProfile"
ADD CONSTRAINT "VoiceBusinessProfile_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceReceptionistSettings"
ADD CONSTRAINT "VoiceReceptionistSettings_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceLead"
ADD CONSTRAINT "VoiceLead_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceCallLog"
ADD CONSTRAINT "VoiceCallLog_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceKnowledgeBaseItem"
ADD CONSTRAINT "VoiceKnowledgeBaseItem_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceIntegrationSettings"
ADD CONSTRAINT "VoiceIntegrationSettings_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
