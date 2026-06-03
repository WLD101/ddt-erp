-- Additive tenant-scoped training profile system for voice.whatsquery.com
-- This does not touch ERP Smart Assistant tables or ERP business data.

CREATE TABLE "VoiceBusinessTrainingProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationCity" TEXT,
    "shortDescription" TEXT,
    "primaryLanguage" TEXT NOT NULL DEFAULT 'AUTO_DETECT',
    "supportedLanguages" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "closingMessage" TEXT,
    "holidayClosures" TEXT,
    "lastPromptSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceBusinessTrainingProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceServiceItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "pricePlaceholder" TEXT,
    "availability" TEXT,
    "notes" TEXT,
    "takeawayAvailable" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false,
    "dineInAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceServiceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceBookingRules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "acceptsBookings" BOOLEAN NOT NULL DEFAULT false,
    "bookingType" TEXT NOT NULL DEFAULT 'APPOINTMENT',
    "bookingMode" TEXT NOT NULL DEFAULT 'REQUEST_ONLY',
    "requiredFields" TEXT,
    "maxPartySize" INTEGER,
    "bookingDurationMinutes" INTEGER,
    "advanceBookingLimitHours" INTEGER,
    "confirmationMessage" TEXT,
    "fallbackMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceBookingRules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceOrderRules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "acceptsOrderRequests" BOOLEAN NOT NULL DEFAULT false,
    "orderMode" TEXT NOT NULL DEFAULT 'REQUEST_ONLY',
    "orderTypes" TEXT,
    "requiredFields" TEXT,
    "allergyDisclaimer" TEXT,
    "confirmationWording" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceOrderRules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceHandoffRules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fallbackPhone" TEXT,
    "fallbackEmail" TEXT,
    "staffNotificationPlaceholder" TEXT,
    "handoffTriggers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceHandoffRules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceAllowedActionPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "allowedActions" TEXT,
    "blockedActions" TEXT,
    "erpWritesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backendAutoConfirmationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceAllowedActionPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceBusinessTrainingProfile_organizationId_key" ON "VoiceBusinessTrainingProfile"("organizationId");
CREATE UNIQUE INDEX "VoiceBookingRules_organizationId_key" ON "VoiceBookingRules"("organizationId");
CREATE UNIQUE INDEX "VoiceOrderRules_organizationId_key" ON "VoiceOrderRules"("organizationId");
CREATE UNIQUE INDEX "VoiceHandoffRules_organizationId_key" ON "VoiceHandoffRules"("organizationId");
CREATE UNIQUE INDEX "VoiceAllowedActionPolicy_organizationId_key" ON "VoiceAllowedActionPolicy"("organizationId");
CREATE UNIQUE INDEX "VoiceServiceItem_id_organizationId_key" ON "VoiceServiceItem"("id", "organizationId");

CREATE INDEX "VoiceBusinessTrainingProfile_organizationId_idx" ON "VoiceBusinessTrainingProfile"("organizationId");
CREATE INDEX "VoiceServiceItem_organizationId_category_idx" ON "VoiceServiceItem"("organizationId", "category");
CREATE INDEX "VoiceServiceItem_organizationId_sortOrder_idx" ON "VoiceServiceItem"("organizationId", "sortOrder");
CREATE INDEX "VoiceBookingRules_organizationId_idx" ON "VoiceBookingRules"("organizationId");
CREATE INDEX "VoiceOrderRules_organizationId_idx" ON "VoiceOrderRules"("organizationId");
CREATE INDEX "VoiceHandoffRules_organizationId_idx" ON "VoiceHandoffRules"("organizationId");
CREATE INDEX "VoiceAllowedActionPolicy_organizationId_idx" ON "VoiceAllowedActionPolicy"("organizationId");

ALTER TABLE "VoiceBusinessTrainingProfile"
ADD CONSTRAINT "VoiceBusinessTrainingProfile_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceServiceItem"
ADD CONSTRAINT "VoiceServiceItem_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceBookingRules"
ADD CONSTRAINT "VoiceBookingRules_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceOrderRules"
ADD CONSTRAINT "VoiceOrderRules_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceHandoffRules"
ADD CONSTRAINT "VoiceHandoffRules_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceAllowedActionPolicy"
ADD CONSTRAINT "VoiceAllowedActionPolicy_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
