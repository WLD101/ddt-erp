-- Add durable telecom call lifecycle records.
-- This migration is additive and preserves existing call_routes/call_logs data.

ALTER TABLE "call_routes" ADD COLUMN "call_id" TEXT;
ALTER TABLE "call_logs" ADD COLUMN "call_id" TEXT;
ALTER TABLE "call_logs" ADD COLUMN "call_attempt_id" TEXT;

CREATE TABLE "calls" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "created_by_user_id" TEXT,
  "idempotency_key" TEXT,
  "request_fingerprint" TEXT,
  "original_destination" TEXT NOT NULL,
  "destination_e164" TEXT NOT NULL,
  "destination_country" TEXT,
  "caller_number_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "raw_provider_status" TEXT,
  "failure_class" TEXT,
  "failure_code" TEXT,
  "failure_message" TEXT,
  "feature_flag_snapshot" TEXT,
  "decision_trace_json" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "call_attempts" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "call_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "route_rule_id" TEXT,
  "caller_number_id" TEXT,
  "destination_e164" TEXT NOT NULL,
  "provider_call_id" TEXT,
  "attempt_number" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "raw_provider_status" TEXT,
  "failure_class" TEXT,
  "failure_code" TEXT,
  "failure_message" TEXT,
  "started_at" TIMESTAMP(3),
  "answered_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "call_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "call_events" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "call_id" TEXT NOT NULL,
  "call_attempt_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_event_id" TEXT NOT NULL,
  "provider_status" TEXT,
  "normalized_status" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "raw_payload" TEXT,
  "occurred_at" TIMESTAMP(3),
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),

  CONSTRAINT "call_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "telecom_webhook_nonces" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT,
  "provider" TEXT NOT NULL,
  "nonce" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "telecom_webhook_nonces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "calls_tenant_id_idempotency_key_key" ON "calls"("tenant_id", "idempotency_key");
CREATE INDEX "calls_tenant_id_created_at_idx" ON "calls"("tenant_id", "created_at" DESC);
CREATE INDEX "calls_status_idx" ON "calls"("status");
CREATE INDEX "calls_destination_country_idx" ON "calls"("destination_country");

CREATE UNIQUE INDEX "call_attempts_call_id_attempt_number_key" ON "call_attempts"("call_id", "attempt_number");
CREATE UNIQUE INDEX "call_attempts_provider_id_provider_call_id_key" ON "call_attempts"("provider_id", "provider_call_id");
CREATE INDEX "call_attempts_tenant_id_created_at_idx" ON "call_attempts"("tenant_id", "created_at" DESC);
CREATE INDEX "call_attempts_call_id_idx" ON "call_attempts"("call_id");
CREATE INDEX "call_attempts_status_idx" ON "call_attempts"("status");

CREATE UNIQUE INDEX "call_events_provider_provider_event_id_key" ON "call_events"("provider", "provider_event_id");
CREATE INDEX "call_events_tenant_id_received_at_idx" ON "call_events"("tenant_id", "received_at" DESC);
CREATE INDEX "call_events_call_id_idx" ON "call_events"("call_id");
CREATE INDEX "call_events_call_attempt_id_idx" ON "call_events"("call_attempt_id");
CREATE INDEX "call_events_normalized_status_idx" ON "call_events"("normalized_status");

CREATE UNIQUE INDEX "telecom_webhook_nonces_provider_nonce_key" ON "telecom_webhook_nonces"("provider", "nonce");
CREATE INDEX "telecom_webhook_nonces_created_at_idx" ON "telecom_webhook_nonces"("created_at");

CREATE INDEX "call_routes_call_id_idx" ON "call_routes"("call_id");
CREATE INDEX "call_logs_call_id_idx" ON "call_logs"("call_id");
CREATE INDEX "call_logs_call_attempt_id_idx" ON "call_logs"("call_attempt_id");

ALTER TABLE "calls"
  ADD CONSTRAINT "calls_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calls"
  ADD CONSTRAINT "calls_caller_number_id_fkey"
  FOREIGN KEY ("caller_number_id") REFERENCES "phone_numbers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "call_attempts"
  ADD CONSTRAINT "call_attempts_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_attempts"
  ADD CONSTRAINT "call_attempts_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "calls"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_attempts"
  ADD CONSTRAINT "call_attempts_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "providers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "call_attempts"
  ADD CONSTRAINT "call_attempts_route_rule_id_fkey"
  FOREIGN KEY ("route_rule_id") REFERENCES "country_routing_rules"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "call_attempts"
  ADD CONSTRAINT "call_attempts_caller_number_id_fkey"
  FOREIGN KEY ("caller_number_id") REFERENCES "phone_numbers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "call_events"
  ADD CONSTRAINT "call_events_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_events"
  ADD CONSTRAINT "call_events_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "calls"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_events"
  ADD CONSTRAINT "call_events_call_attempt_id_fkey"
  FOREIGN KEY ("call_attempt_id") REFERENCES "call_attempts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "telecom_webhook_nonces"
  ADD CONSTRAINT "telecom_webhook_nonces_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_routes"
  ADD CONSTRAINT "call_routes_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "calls"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "call_logs"
  ADD CONSTRAINT "call_logs_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "calls"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "call_logs"
  ADD CONSTRAINT "call_logs_call_attempt_id_fkey"
  FOREIGN KEY ("call_attempt_id") REFERENCES "call_attempts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
