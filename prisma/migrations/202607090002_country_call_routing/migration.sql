-- Country-based telecom routing foundation for WhatsQuery Voice.
-- Additive only: does not modify existing ERP or receptionist tables.

CREATE TABLE "providers" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "country_code" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "priority" INTEGER NOT NULL DEFAULT 100,
  "config_json" TEXT,
  "credentials_encrypted" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "country_routing_rules" (
  "id" TEXT NOT NULL,
  "country_name" TEXT NOT NULL,
  "iso_code" TEXT NOT NULL,
  "dial_code" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "fallback_provider_id" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "country_routing_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "phone_numbers" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "country_code" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'both',
  "verified_status" TEXT NOT NULL DEFAULT 'pending',
  "caller_id_allowed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "call_routes" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "from_number" TEXT,
  "to_number" TEXT NOT NULL,
  "detected_country" TEXT NOT NULL,
  "selected_provider_id" TEXT NOT NULL,
  "route_reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'selected',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "call_routes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "call_logs" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "provider_id" TEXT,
  "external_call_id" TEXT,
  "from_number" TEXT,
  "to_number" TEXT,
  "direction" TEXT NOT NULL,
  "country" TEXT,
  "call_status" TEXT NOT NULL,
  "duration" INTEGER,
  "recording_url" TEXT,
  "transcript_id" TEXT,
  "cost" DECIMAL(12,4),
  "currency" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "providers_name_country_code_key" ON "providers"("name", "country_code");
CREATE INDEX "providers_country_code_status_priority_idx" ON "providers"("country_code", "status", "priority");

CREATE UNIQUE INDEX "country_routing_rules_iso_code_dial_code_key" ON "country_routing_rules"("iso_code", "dial_code");
CREATE INDEX "country_routing_rules_dial_code_is_active_idx" ON "country_routing_rules"("dial_code", "is_active");
CREATE INDEX "country_routing_rules_provider_id_idx" ON "country_routing_rules"("provider_id");

CREATE UNIQUE INDEX "phone_numbers_tenant_id_number_key" ON "phone_numbers"("tenant_id", "number");
CREATE INDEX "phone_numbers_tenant_id_country_code_idx" ON "phone_numbers"("tenant_id", "country_code");
CREATE INDEX "phone_numbers_provider_id_idx" ON "phone_numbers"("provider_id");

CREATE INDEX "call_routes_tenant_id_created_at_idx" ON "call_routes"("tenant_id", "created_at" DESC);
CREATE INDEX "call_routes_selected_provider_id_idx" ON "call_routes"("selected_provider_id");
CREATE INDEX "call_routes_detected_country_idx" ON "call_routes"("detected_country");

CREATE UNIQUE INDEX "call_logs_provider_id_external_call_id_key" ON "call_logs"("provider_id", "external_call_id");
CREATE INDEX "call_logs_tenant_id_created_at_idx" ON "call_logs"("tenant_id", "created_at" DESC);
CREATE INDEX "call_logs_provider_id_idx" ON "call_logs"("provider_id");
CREATE INDEX "call_logs_country_idx" ON "call_logs"("country");
CREATE INDEX "call_logs_call_status_idx" ON "call_logs"("call_status");

ALTER TABLE "country_routing_rules"
  ADD CONSTRAINT "country_routing_rules_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "providers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "country_routing_rules"
  ADD CONSTRAINT "country_routing_rules_fallback_provider_id_fkey"
  FOREIGN KEY ("fallback_provider_id") REFERENCES "providers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "phone_numbers"
  ADD CONSTRAINT "phone_numbers_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "phone_numbers"
  ADD CONSTRAINT "phone_numbers_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "providers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "call_routes"
  ADD CONSTRAINT "call_routes_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_routes"
  ADD CONSTRAINT "call_routes_selected_provider_id_fkey"
  FOREIGN KEY ("selected_provider_id") REFERENCES "providers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "call_logs"
  ADD CONSTRAINT "call_logs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_logs"
  ADD CONSTRAINT "call_logs_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "providers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
