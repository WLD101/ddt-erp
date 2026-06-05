-- AlterTable
ALTER TABLE "VoiceReceptionistSettings" ADD COLUMN "capacityMode" TEXT NOT NULL DEFAULT 'direct_ai';

-- AlterTable
ALTER TABLE "VoiceUsageMeter" ADD COLUMN "activeCalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "maxActiveCalls" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "VoiceReservationRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "voiceAgentId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "partySize" INTEGER,
    "requestedTime" TIMESTAMP(3),
    "specialRequests" TEXT,
    "status" TEXT NOT NULL DEFAULT 'needs_staff_review',
    "providerCallId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceReservationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceOrderRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "voiceAgentId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
    "orderDetailsText" TEXT NOT NULL,
    "totalEstimated" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'needs_staff_review',
    "providerCallId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceOrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceReservationRequest_organizationId_createdAt_idx" ON "VoiceReservationRequest"("organizationId", "createdAt" DESC);
CREATE INDEX "VoiceReservationRequest_voiceAgentId_idx" ON "VoiceReservationRequest"("voiceAgentId");
CREATE INDEX "VoiceReservationRequest_status_idx" ON "VoiceReservationRequest"("status");

-- CreateIndex
CREATE INDEX "VoiceOrderRequest_organizationId_createdAt_idx" ON "VoiceOrderRequest"("organizationId", "createdAt" DESC);
CREATE INDEX "VoiceOrderRequest_voiceAgentId_idx" ON "VoiceOrderRequest"("voiceAgentId");
CREATE INDEX "VoiceOrderRequest_status_idx" ON "VoiceOrderRequest"("status");

-- AddForeignKey
ALTER TABLE "VoiceReservationRequest" ADD CONSTRAINT "VoiceReservationRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceReservationRequest" ADD CONSTRAINT "VoiceReservationRequest_voiceAgentId_fkey" FOREIGN KEY ("voiceAgentId") REFERENCES "VoiceAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceOrderRequest" ADD CONSTRAINT "VoiceOrderRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceOrderRequest" ADD CONSTRAINT "VoiceOrderRequest_voiceAgentId_fkey" FOREIGN KEY ("voiceAgentId") REFERENCES "VoiceAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
