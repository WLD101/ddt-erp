-- Additive security foundation for MFA, trusted devices, sign-in challenges,
-- tenant session policy, and security event telemetry.

CREATE TABLE "UserSecurityProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpSecretEncrypted" TEXT,
    "pendingTotpSecretEncrypted" TEXT,
    "recoveryCodeVersion" INTEGER NOT NULL DEFAULT 0,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastRecoveryGeneratedAt" TIMESTAMP(3),
    "passkeyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSecurityProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "redirectTo" TEXT,
    "trustDeviceRequested" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationSecurityPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requireTwoFactorForAllUsers" BOOLEAN NOT NULL DEFAULT false,
    "requireTwoFactorForPrivileged" BOOLEAN NOT NULL DEFAULT true,
    "enforcePasskeysForAdmins" BOOLEAN NOT NULL DEFAULT false,
    "restrictConcurrentSessions" BOOLEAN NOT NULL DEFAULT false,
    "maxActiveDevices" INTEGER,
    "idleTimeoutMinutes" INTEGER NOT NULL DEFAULT 480,
    "absoluteSessionLifetimeMinutes" INTEGER,
    "staffIdleTimeoutMinutes" INTEGER,
    "managerIdleTimeoutMinutes" INTEGER,
    "accountantIdleTimeoutMinutes" INTEGER,
    "adminIdleTimeoutMinutes" INTEGER,
    "superAdminIdleTimeoutMinutes" INTEGER,
    "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false,
    "emergencyLockEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSecurityPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'info',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSecurityProfile_userId_key" ON "UserSecurityProfile"("userId");
CREATE UNIQUE INDEX "TrustedDevice_tokenHash_key" ON "TrustedDevice"("tokenHash");
CREATE UNIQUE INDEX "AuthChallenge_tokenHash_key" ON "AuthChallenge"("tokenHash");
CREATE UNIQUE INDEX "OrganizationSecurityPolicy_organizationId_key" ON "OrganizationSecurityPolicy"("organizationId");

CREATE INDEX "RecoveryCode_userId_idx" ON "RecoveryCode"("userId");
CREATE INDEX "TrustedDevice_userId_expiresAt_idx" ON "TrustedDevice"("userId", "expiresAt");
CREATE INDEX "TrustedDevice_organizationId_idx" ON "TrustedDevice"("organizationId");
CREATE INDEX "AuthChallenge_userId_purpose_expiresAt_idx" ON "AuthChallenge"("userId", "purpose", "expiresAt");
CREATE INDEX "AuthChallenge_organizationId_idx" ON "AuthChallenge"("organizationId");
CREATE INDEX "SecurityEvent_organizationId_createdAt_idx" ON "SecurityEvent"("organizationId", "createdAt" DESC);
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt" DESC);
CREATE INDEX "SecurityEvent_type_createdAt_idx" ON "SecurityEvent"("type", "createdAt" DESC);

ALTER TABLE "UserSecurityProfile"
ADD CONSTRAINT "UserSecurityProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecoveryCode"
ADD CONSTRAINT "RecoveryCode_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrustedDevice"
ADD CONSTRAINT "TrustedDevice_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrustedDevice"
ADD CONSTRAINT "TrustedDevice_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthChallenge"
ADD CONSTRAINT "AuthChallenge_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthChallenge"
ADD CONSTRAINT "AuthChallenge_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationSecurityPolicy"
ADD CONSTRAINT "OrganizationSecurityPolicy_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationSecurityPolicy"
ADD CONSTRAINT "OrganizationSecurityPolicy_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SecurityEvent"
ADD CONSTRAINT "SecurityEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SecurityEvent"
ADD CONSTRAINT "SecurityEvent_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
