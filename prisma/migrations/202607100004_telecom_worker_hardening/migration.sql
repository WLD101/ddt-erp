ALTER TABLE "VoiceJob"
ADD COLUMN "worker_version" TEXT,
ADD COLUMN "lease_expires_at" TIMESTAMP(3),
ADD COLUMN "last_heartbeat_at" TIMESTAMP(3),
ADD COLUMN "timeout_at" TIMESTAMP(3),
ADD COLUMN "cancel_requested_at" TIMESTAMP(3),
ADD COLUMN "cancelled_at" TIMESTAMP(3),
ADD COLUMN "cancel_reason" TEXT;

CREATE INDEX "VoiceJob_status_lease_expires_at_idx" ON "VoiceJob"("status", "lease_expires_at");
