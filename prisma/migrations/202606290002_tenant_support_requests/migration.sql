CREATE TABLE "SupportRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "reason" TEXT,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sourcePage" TEXT,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "adminNotes" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),

  CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportRequest"
ADD CONSTRAINT "SupportRequest_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportRequest"
ADD CONSTRAINT "SupportRequest_requestedById_fkey"
FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "SupportRequest_organizationId_createdAt_idx" ON "SupportRequest"("organizationId", "createdAt" DESC);
CREATE INDEX "SupportRequest_requestedById_idx" ON "SupportRequest"("requestedById");
CREATE INDEX "SupportRequest_type_status_createdAt_idx" ON "SupportRequest"("type", "status", "createdAt" DESC);
