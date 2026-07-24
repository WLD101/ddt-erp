-- Phase 2 telecom operational readiness.
-- Additive migration: preserves existing provider, route, call, attempt, event, log, and nonce data.

ALTER TABLE "providers" ADD COLUMN "manual_health_status" TEXT;
ALTER TABLE "providers" ADD COLUMN "health_status" TEXT NOT NULL DEFAULT 'HEALTHY';
ALTER TABLE "providers" ADD COLUMN "last_health_check_at" TIMESTAMP(3);
ALTER TABLE "providers" ADD COLUMN "last_successful_call_at" TIMESTAMP(3);
ALTER TABLE "providers" ADD COLUMN "last_failed_call_at" TIMESTAMP(3);
ALTER TABLE "providers" ADD COLUMN "temporary_failures" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "providers" ADD COLUMN "permanent_failures" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "providers" ADD COLUMN "recent_success_rate" DOUBLE PRECISION;
ALTER TABLE "providers" ADD COLUMN "average_setup_time_ms" INTEGER;
ALTER TABLE "providers" ADD COLUMN "webhook_delay_ms" INTEGER;
ALTER TABLE "providers" ADD COLUMN "concurrent_active_calls" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "providers" ADD COLUMN "provider_availability" TEXT;
ALTER TABLE "providers" ADD COLUMN "health_message" TEXT;

ALTER TABLE "country_routing_rules" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "country_routing_rules" ADD COLUMN "prefix" TEXT;
ALTER TABLE "country_routing_rules" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "country_routing_rules" ADD COLUMN "weight" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "country_routing_rules" ADD COLUMN "valid_from" TIMESTAMP(3);
ALTER TABLE "country_routing_rules" ADD COLUMN "valid_until" TIMESTAMP(3);
ALTER TABLE "country_routing_rules" ADD COLUMN "max_concurrent_calls" INTEGER;
ALTER TABLE "country_routing_rules" ADD COLUMN "calls_per_second" INTEGER;
ALTER TABLE "country_routing_rules" ADD COLUMN "require_healthy_provider" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "country_routing_rules" ADD COLUMN "fallback_eligible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "country_routing_rules" ADD COLUMN "emergency_override" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "country_routing_rules" ADD COLUMN "business_hours_json" TEXT;

ALTER TABLE "telecom_webhook_nonces" ADD COLUMN "expires_at" TIMESTAMP(3);
UPDATE "telecom_webhook_nonces" SET "expires_at" = "created_at" + INTERVAL '10 minutes' WHERE "expires_at" IS NULL;
ALTER TABLE "telecom_webhook_nonces" ALTER COLUMN "expires_at" SET NOT NULL;

CREATE TABLE "provider_health_checks" (
  "id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "response_time_ms" INTEGER,
  "provider_availability" TEXT,
  "temporary_failure_count" INTEGER NOT NULL DEFAULT 0,
  "permanent_failure_count" INTEGER NOT NULL DEFAULT 0,
  "recent_success_rate" DOUBLE PRECISION,
  "average_setup_time_ms" INTEGER,
  "webhook_delay_ms" INTEGER,
  "concurrent_active_calls" INTEGER NOT NULL DEFAULT 0,
  "message" TEXT,
  "safe_details_json" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "provider_health_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "providers_health_status_last_health_check_at_idx" ON "providers"("health_status", "last_health_check_at");
CREATE INDEX "country_routing_rules_tenant_id_iso_code_is_active_priority_idx" ON "country_routing_rules"("tenant_id", "iso_code", "is_active", "priority");
CREATE INDEX "country_routing_rules_dial_code_is_active_priority_idx" ON "country_routing_rules"("dial_code", "is_active", "priority");
CREATE INDEX "telecom_webhook_nonces_expires_at_idx" ON "telecom_webhook_nonces"("expires_at");
CREATE INDEX "provider_health_checks_provider_id_checked_at_idx" ON "provider_health_checks"("provider_id", "checked_at" DESC);
CREATE INDEX "provider_health_checks_status_checked_at_idx" ON "provider_health_checks"("status", "checked_at");

ALTER TABLE "provider_health_checks"
  ADD CONSTRAINT "provider_health_checks_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "providers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
