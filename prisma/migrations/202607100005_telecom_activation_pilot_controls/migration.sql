ALTER TABLE "phone_numbers"
ADD COLUMN "pilot_approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pilot_approval_reason" TEXT,
ADD COLUMN "pilot_approved_by" TEXT,
ADD COLUMN "pilot_approved_at" TIMESTAMP(3),
ADD COLUMN "pilot_approval_expires_at" TIMESTAMP(3);

CREATE INDEX "phone_numbers_tenant_id_pilot_approved_pilot_approval_expires_at_idx"
ON "phone_numbers"("tenant_id", "pilot_approved", "pilot_approval_expires_at");

ALTER TABLE "TelecomActivationControl"
ADD COLUMN "reason" TEXT,
ADD COLUMN "allowedCountryCodesJson" TEXT,
ADD COLUMN "businessHoursJson" TEXT,
ADD COLUMN "timezone" TEXT,
ADD COLUMN "maxEstimatedCallCostUsd" DOUBLE PRECISION,
ADD COLUMN "maxCallsPerHour" INTEGER,
ADD COLUMN "maxCallsPerDay" INTEGER,
ADD COLUMN "maxConcurrentCalls" INTEGER,
ADD COLUMN "maxCallDurationSec" INTEGER,
ADD COLUMN "effectiveFrom" TIMESTAMP(3),
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedBy" TEXT;

CREATE INDEX "TelecomActivationControl_effectiveFrom_expiresAt_idx"
ON "TelecomActivationControl"("effectiveFrom", "expiresAt");

CREATE TABLE "telecom_allowed_destinations" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "destination_e164" TEXT NOT NULL,
  "label" TEXT,
  "status" TEXT NOT NULL DEFAULT 'verified',
  "verified_at" TIMESTAMP(3),
  "verified_by" TEXT,
  "effective_from" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "telecom_allowed_destinations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "telecom_allowed_destinations_organization_id_destination_e164_key"
ON "telecom_allowed_destinations"("organization_id", "destination_e164");

CREATE INDEX "telecom_allowed_destinations_organization_id_status_expires_at_idx"
ON "telecom_allowed_destinations"("organization_id", "status", "expires_at");

CREATE INDEX "telecom_allowed_destinations_organization_id_effective_from_expires_at_idx"
ON "telecom_allowed_destinations"("organization_id", "effective_from", "expires_at");

ALTER TABLE "telecom_allowed_destinations"
ADD CONSTRAINT "telecom_allowed_destinations_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
