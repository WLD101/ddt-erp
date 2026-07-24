import "server-only";

import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { generateSecret, generateURI, verifySync } from "otplib";
import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken } from "@/lib/security/tokens";
import { getSecurityEncryptionSecret } from "@/lib/security/env";

const MFA_ALGORITHM = "aes-256-gcm";
const MFA_KEY_LENGTH = 32;
const MFA_IV_LENGTH = 16;
const RECOVERY_CODE_COUNT = 8;
const TRUSTED_DEVICE_TTL_DAYS = 30;
const LOGIN_CHALLENGE_TTL_MINUTES = 10;
export const TRUSTED_DEVICE_COOKIE = "wq_trusted_device";

function deriveKey() {
  return crypto.scryptSync(getSecurityEncryptionSecret(), "whatsquery-auth-security", MFA_KEY_LENGTH);
}

function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(MFA_IV_LENGTH);
  const cipher = crypto.createCipheriv(MFA_ALGORITHM, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

function decryptSecret(payload: string | null | undefined) {
  if (!payload) return null;
  const [ivHex, authTagHex, encryptedHex] = payload.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Stored MFA secret is malformed.");
  }
  const decipher = crypto.createDecipheriv(MFA_ALGORITHM, deriveKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

function hashRecoveryCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    `${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}`.toUpperCase(),
  );
}

function isPrivilegedRole(role: string) {
  return ["owner", "admin", "super_admin"].includes(role);
}

export async function getRequestSecurityMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || null,
    userAgent: headerStore.get("user-agent") || null,
  };
}

export async function logSecurityEvent(input: {
  userId?: string | null;
  organizationId?: string | null;
  type: string;
  status?: string;
  details?: string;
  metadata?: Record<string, unknown> | null;
}) {
  const requestMeta = await getRequestSecurityMetadata().catch(() => ({ ipAddress: null, userAgent: null }));
  await prisma.securityEvent.create({
    data: {
      userId: input.userId || null,
      organizationId: input.organizationId || null,
      type: input.type,
      status: input.status || "info",
      details: input.details || null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    },
  }).catch(() => null);
}

export async function getOrCreateSecurityPolicy(organizationId: string, updatedById?: string) {
  return prisma.organizationSecurityPolicy.upsert({
    where: { organizationId },
    update: updatedById ? { updatedById } : {},
    create: {
      organizationId,
      updatedById,
    },
  });
}

export async function getOrCreateUserSecurityProfile(userId: string) {
  return prisma.userSecurityProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getUserSecurityOverview(userId: string, organizationId: string) {
  const [profile, trustedDevices, policy] = await Promise.all([
    getOrCreateUserSecurityProfile(userId),
    prisma.trustedDevice.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
      take: 20,
    }),
    getOrCreateSecurityPolicy(organizationId),
  ]);

  return {
    profile,
    trustedDevices,
    policy,
    recoveryCodeCount: await prisma.recoveryCode.count({
      where: { userId, usedAt: null },
    }),
  };
}

export async function clearTrustedDeviceCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TRUSTED_DEVICE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function beginTotpEnrollment(input: {
  userId: string;
  email: string;
  organizationName: string;
}) {
  const profile = await getOrCreateUserSecurityProfile(input.userId);
  const secret = generateSecret();
  const encrypted = encryptSecret(secret);

  await prisma.userSecurityProfile.update({
    where: { userId: input.userId },
    data: {
      pendingTotpSecretEncrypted: encrypted,
    },
  });

  const otpauthUrl = generateURI({
    secret,
    issuer: `WhatsQuery - ${input.organizationName}`,
    label: input.email,
    strategy: "totp",
    digits: 6,
    period: 30,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    margin: 1,
    width: 240,
  });

  return {
    alreadyEnabled: profile.totpEnabled,
    otpauthUrl,
    qrCodeDataUrl,
    manualEntryKey: secret,
  };
}

async function replaceRecoveryCodes(userId: string) {
  const codes = generateRecoveryCodes();
  await prisma.$transaction([
    prisma.recoveryCode.deleteMany({ where: { userId } }),
    prisma.recoveryCode.createMany({
      data: codes.map((code) => ({
        userId,
        codeHash: hashRecoveryCode(code),
      })),
    }),
    prisma.userSecurityProfile.update({
      where: { userId },
      data: {
        recoveryCodeVersion: { increment: 1 },
        lastRecoveryGeneratedAt: new Date(),
      },
    }),
  ]);
  return codes;
}

export async function confirmTotpEnrollment(userId: string, code: string) {
  const profile = await getOrCreateUserSecurityProfile(userId);
  const secret = decryptSecret(profile.pendingTotpSecretEncrypted);
  if (!secret) {
    throw new Error("No pending authenticator setup was found. Start setup again.");
  }

  const isValid = verifySync({ token: code, secret, strategy: "totp", digits: 6, period: 30, epochTolerance: 1 });
  if (!isValid) {
    throw new Error("Invalid verification code.");
  }

  const recoveryCodes = generateRecoveryCodes();
  await prisma.$transaction([
    prisma.userSecurityProfile.update({
      where: { userId },
      data: {
        totpEnabled: true,
        totpSecretEncrypted: profile.pendingTotpSecretEncrypted,
        pendingTotpSecretEncrypted: null,
        recoveryCodeVersion: { increment: 1 },
        lastRecoveryGeneratedAt: new Date(),
      },
    }),
    prisma.recoveryCode.deleteMany({ where: { userId } }),
    prisma.recoveryCode.createMany({
      data: recoveryCodes.map((rawCode) => ({
        userId,
        codeHash: hashRecoveryCode(rawCode),
      })),
    }),
  ]);

  return recoveryCodes;
}

export async function verifyTotpOrRecovery(userId: string, code: string) {
  const profile = await getOrCreateUserSecurityProfile(userId);
  const normalizedCode = code.trim().replace(/\s+/g, "").toUpperCase();

  if (profile.totpEnabled) {
    const secret = decryptSecret(profile.totpSecretEncrypted);
    if (secret && verifySync({ token: normalizedCode, secret, strategy: "totp", digits: 6, period: 30, epochTolerance: 1 })) {
      return { method: "totp" as const };
    }
  }

  const recoveryHash = hashRecoveryCode(normalizedCode);
  const recovery = await prisma.recoveryCode.findFirst({
    where: { userId, codeHash: recoveryHash, usedAt: null },
  });
  if (recovery) {
    await prisma.recoveryCode.update({
      where: { id: recovery.id },
      data: { usedAt: new Date() },
    });
    return { method: "recovery" as const };
  }

  throw new Error("The verification code or recovery code is invalid.");
}

export async function disableTotpForUser(input: {
  userId: string;
  password: string;
  verificationCode: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { password: true },
  });
  if (!user?.password) {
    throw new Error("Password re-authentication is required.");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect.");
  }

  await verifyTotpOrRecovery(input.userId, input.verificationCode);

  await prisma.$transaction([
    prisma.userSecurityProfile.update({
      where: { userId: input.userId },
      data: {
        totpEnabled: false,
        totpSecretEncrypted: null,
        pendingTotpSecretEncrypted: null,
        sessionVersion: { increment: 1 },
      },
    }),
    prisma.recoveryCode.deleteMany({ where: { userId: input.userId } }),
    prisma.trustedDevice.updateMany({
      where: { userId: input.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await clearTrustedDeviceCookie().catch(() => null);
}

export async function regenerateRecoveryCodesForUser(input: {
  userId: string;
  password: string;
  verificationCode: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { password: true },
  });
  if (!user?.password) {
    throw new Error("Password re-authentication is required.");
  }
  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect.");
  }

  await verifyTotpOrRecovery(input.userId, input.verificationCode);
  return replaceRecoveryCodes(input.userId);
}

export async function updateTrustedDeviceUsage(userId: string, rawToken: string) {
  const now = new Date();
  const tokenHash = hashToken(rawToken);
  const device = await prisma.trustedDevice.findFirst({
    where: {
      userId,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
  });
  if (!device) {
    return null;
  }
  await prisma.trustedDevice.update({
    where: { id: device.id },
    data: { lastUsedAt: now },
  }).catch(() => null);
  return device;
}

export async function issueTrustedDevice(input: {
  userId: string;
  organizationId?: string | null;
  label?: string | null;
  maxActiveDevices?: number | null;
}) {
  const { token, tokenHash } = createOpaqueToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000);
  const requestMeta = await getRequestSecurityMetadata().catch(() => ({ ipAddress: null, userAgent: null }));

  await prisma.trustedDevice.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId || null,
      tokenHash,
      label: input.label || "Trusted device",
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      expiresAt,
      lastUsedAt: now,
    },
  });

  if (input.maxActiveDevices && input.maxActiveDevices > 0) {
    const activeDevices = await prisma.trustedDevice.findMany({
      where: { userId: input.userId, revokedAt: null, expiresAt: { gt: now } },
      orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
    });
    const overflow = activeDevices.slice(input.maxActiveDevices);
    if (overflow.length) {
      await prisma.trustedDevice.updateMany({
        where: { id: { in: overflow.map((device) => device.id) } },
        data: { revokedAt: now },
      });
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(TRUSTED_DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function revokeTrustedDevice(userId: string, deviceId: string) {
  await prisma.trustedDevice.updateMany({
    where: { id: deviceId, userId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.$transaction([
    prisma.userSecurityProfile.update({
      where: { userId },
      data: {
        sessionVersion: { increment: 1 },
      },
    }),
    prisma.trustedDevice.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.authChallenge.updateMany({
      where: { userId, completedAt: null },
      data: { completedAt: new Date() },
    }),
  ]);
}

export async function createSignInChallenge(input: {
  userId: string;
  organizationId?: string | null;
  redirectTo?: string | null;
  trustDeviceRequested?: boolean;
}) {
  const { token, tokenHash } = createOpaqueToken();
  const expiresAt = new Date(Date.now() + LOGIN_CHALLENGE_TTL_MINUTES * 60 * 1000);
  await prisma.authChallenge.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId || null,
      tokenHash,
      purpose: "SIGN_IN_2FA",
      redirectTo: input.redirectTo || "/dashboard",
      trustDeviceRequested: input.trustDeviceRequested ?? false,
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export async function getChallengeByToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const challenge = await prisma.authChallenge.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          memberships: {
            orderBy: { createdAt: "asc" },
            include: { role: true },
          },
        },
      },
    },
  });
  if (!challenge || challenge.expiresAt <= new Date() || challenge.completedAt) {
    throw new Error("This security verification link is invalid or expired.");
  }
  return challenge;
}

export async function verifySignInChallenge(input: {
  challengeToken: string;
  verificationCode: string;
  rememberDevice?: boolean;
}) {
  const challenge = await getChallengeByToken(input.challengeToken);
  if (!challenge.user.email) {
    throw new Error("Unable to resolve the account for this verification challenge.");
  }

  await verifyTotpOrRecovery(challenge.userId, input.verificationCode);
  await prisma.authChallenge.update({
    where: { id: challenge.id },
    data: { verifiedAt: new Date() },
  });

  const membership = challenge.user.memberships[0];
  const policy = membership
    ? await getOrCreateSecurityPolicy(membership.organizationId)
    : null;

  if (input.rememberDevice && membership) {
    await issueTrustedDevice({
      userId: challenge.userId,
      organizationId: membership.organizationId,
      label: "Trusted browser",
      maxActiveDevices: policy?.maxActiveDevices ?? null,
    });
  }

  return {
    email: challenge.user.email,
    redirectTo: challenge.redirectTo || "/dashboard",
  };
}

export async function consumeVerifiedSignInChallenge(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const challenge = await prisma.authChallenge.findUnique({
    where: { tokenHash },
    include: {
      user: true,
    },
  });

  if (
    !challenge ||
    challenge.expiresAt <= new Date() ||
    challenge.completedAt ||
    !challenge.verifiedAt ||
    challenge.user.deletedAt ||
    challenge.user.authStatus !== "verified"
  ) {
    return null;
  }

  const consumed = await prisma.authChallenge.updateMany({
    where: {
      id: challenge.id,
      completedAt: null,
      verifiedAt: { not: null },
      expiresAt: { gt: new Date() },
    },
    data: { completedAt: new Date() },
  });
  if (consumed.count !== 1) {
    return null;
  }

  return challenge.user;
}

export async function shouldRequireTwoFactor(input: {
  userId: string;
  organizationId?: string | null;
  role?: string | null;
}) {
  const profile = await getOrCreateUserSecurityProfile(input.userId);
  const policy = input.organizationId ? await getOrCreateSecurityPolicy(input.organizationId) : null;

  const policyRequires =
    !!policy?.requireTwoFactorForAllUsers ||
    (!!input.role && isPrivilegedRole(input.role) && !!policy?.requireTwoFactorForPrivileged);

  return {
    profile,
    policy,
    required: profile.totpEnabled || policyRequires,
    enrolled: profile.totpEnabled,
  };
}

export async function getSessionSecurityState(input: {
  userId: string;
  organizationId?: string | null;
}) {
  const [user, profile, policy] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.userId },
      select: { deletedAt: true, authStatus: true },
    }),
    getOrCreateUserSecurityProfile(input.userId),
    input.organizationId ? getOrCreateSecurityPolicy(input.organizationId) : null,
  ]);

  return {
    profile,
    policy,
    sessionVersion: profile.sessionVersion,
    policyUpdatedAt: policy?.updatedAt?.getTime() ?? null,
    emergencyLockEnabled: !!policy?.emergencyLockEnabled,
    accountDisabled:
      !user || !!user.deletedAt || user.authStatus !== "verified",
  };
}

export function resolveIdleTimeoutForRole(policy: {
  idleTimeoutMinutes: number;
  staffIdleTimeoutMinutes?: number | null;
  managerIdleTimeoutMinutes?: number | null;
  accountantIdleTimeoutMinutes?: number | null;
  adminIdleTimeoutMinutes?: number | null;
  superAdminIdleTimeoutMinutes?: number | null;
} | null, role: string) {
  if (!policy) return null;
  const normalizedRole = role.toLowerCase();
  if (normalizedRole === "staff") return policy.staffIdleTimeoutMinutes ?? policy.idleTimeoutMinutes;
  if (normalizedRole === "manager") return policy.managerIdleTimeoutMinutes ?? policy.idleTimeoutMinutes;
  if (normalizedRole === "accountant") return policy.accountantIdleTimeoutMinutes ?? policy.idleTimeoutMinutes;
  if (normalizedRole === "admin") return policy.adminIdleTimeoutMinutes ?? policy.idleTimeoutMinutes;
  if (normalizedRole === "super_admin") return policy.superAdminIdleTimeoutMinutes ?? policy.idleTimeoutMinutes;
  if (normalizedRole === "owner") return policy.adminIdleTimeoutMinutes ?? policy.idleTimeoutMinutes;
  return policy.idleTimeoutMinutes;
}

export async function updateOrganizationSecurityPolicy(input: {
  organizationId: string;
  updatedById: string;
  data: {
    requireTwoFactorForAllUsers: boolean;
    requireTwoFactorForPrivileged: boolean;
    enforcePasskeysForAdmins: boolean;
    restrictConcurrentSessions: boolean;
    forcePasswordReset: boolean;
    emergencyLockEnabled: boolean;
    maxActiveDevices: number | null;
    idleTimeoutMinutes: number;
    absoluteSessionLifetimeMinutes: number | null;
    staffIdleTimeoutMinutes: number | null;
    managerIdleTimeoutMinutes: number | null;
    accountantIdleTimeoutMinutes: number | null;
    adminIdleTimeoutMinutes: number | null;
    superAdminIdleTimeoutMinutes: number | null;
  };
}) {
  return prisma.organizationSecurityPolicy.upsert({
    where: { organizationId: input.organizationId },
    update: {
      ...input.data,
      updatedById: input.updatedById,
    },
    create: {
      organizationId: input.organizationId,
      updatedById: input.updatedById,
      ...input.data,
    },
  });
}
