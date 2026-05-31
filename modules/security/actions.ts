"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

import { signIn } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import {
  beginTotpEnrollment,
  clearTrustedDeviceCookie,
  confirmTotpEnrollment,
  disableTotpForUser,
  getUserSecurityOverview,
  logSecurityEvent,
  regenerateRecoveryCodesForUser,
  revokeAllUserSessions,
  revokeTrustedDevice,
  updateOrganizationSecurityPolicy,
  verifySignInChallenge,
} from "@/modules/security/service";
import {
  disableTotpSchema,
  securityPolicySchema,
  totpCodeSchema,
  verifyChallengeSchema,
} from "@/modules/security/schema";

export async function beginTotpEnrollmentAction() {
  const ctx = await getCurrentTenantContext();
  const organization = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { name: true },
  });
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { email: true },
  });

  if (!organization?.name || !user?.email) {
    return { error: "We couldn't start authenticator setup for this account." };
  }

  const setup = await beginTotpEnrollment({
    userId: ctx.userId,
    email: user.email,
    organizationName: organization.name,
  });

  await logSecurityEvent({
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    type: "auth.2fa.setup_started",
    status: "info",
    details: "Authenticator app enrollment started.",
  }).catch(() => null);

  return { success: true, data: setup };
}

export async function confirmTotpEnrollmentAction(rawData: { code: string }) {
  const ctx = await getCurrentTenantContext();
  const parsed = totpCodeSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid 6-digit code." };
  }

  try {
    const recoveryCodes = await confirmTotpEnrollment(ctx.userId, parsed.data.code);
    await writeAuditLog(ctx, "ENABLE_2FA", "UserSecurityProfile", ctx.userId, "Enabled authenticator-based two-factor authentication.");
    await logSecurityEvent({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      type: "auth.2fa.enabled",
      status: "success",
      details: "Authenticator-based 2FA enabled.",
    }).catch(() => null);
    revalidatePath("/settings/security");
    revalidatePath("/dashboard");
    return { success: true, data: { recoveryCodes } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not verify the authenticator code." };
  }
}

export async function disableTotpAction(rawData: { password: string; verificationCode: string }) {
  const ctx = await getCurrentTenantContext();
  const parsed = disableTotpSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Re-authentication is required." };
  }

  try {
    await disableTotpForUser({
      userId: ctx.userId,
      password: parsed.data.password,
      verificationCode: parsed.data.verificationCode,
    });
    await writeAuditLog(ctx, "DISABLE_2FA", "UserSecurityProfile", ctx.userId, "Disabled authenticator-based two-factor authentication.");
    await logSecurityEvent({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      type: "auth.2fa.disabled",
      status: "warning",
      details: "Authenticator-based 2FA disabled.",
    }).catch(() => null);
    revalidatePath("/settings/security");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't disable two-factor authentication." };
  }
}

export async function regenerateRecoveryCodesAction(rawData: { password: string; verificationCode: string }) {
  const ctx = await getCurrentTenantContext();
  const parsed = disableTotpSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Re-authentication is required." };
  }

  try {
    const recoveryCodes = await regenerateRecoveryCodesForUser({
      userId: ctx.userId,
      password: parsed.data.password,
      verificationCode: parsed.data.verificationCode,
    });
    await writeAuditLog(ctx, "ROTATE_RECOVERY_CODES", "UserSecurityProfile", ctx.userId, "Rotated recovery codes for two-factor authentication.");
    await logSecurityEvent({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      type: "auth.2fa.recovery_rotated",
      status: "warning",
      details: "Recovery codes regenerated.",
    }).catch(() => null);
    revalidatePath("/settings/security");
    return { success: true, data: { recoveryCodes } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't regenerate recovery codes." };
  }
}

export async function revokeTrustedDeviceAction(deviceId: string) {
  const ctx = await getCurrentTenantContext();
  await revokeTrustedDevice(ctx.userId, deviceId);
  await clearTrustedDeviceCookie().catch(() => null);
  await writeAuditLog(ctx, "REVOKE_TRUSTED_DEVICE", "TrustedDevice", deviceId, "Revoked a trusted device from the current account.");
  revalidatePath("/settings/security");
  return { success: true };
}

export async function revokeMySessionsAction() {
  const ctx = await getCurrentTenantContext();
  await revokeAllUserSessions(ctx.userId);
  await clearTrustedDeviceCookie().catch(() => null);
  await writeAuditLog(ctx, "REVOKE_USER_SESSIONS", "UserSecurityProfile", ctx.userId, "Revoked all active sessions for the current account.");
  await logSecurityEvent({
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    type: "auth.session.revoked_self",
    status: "warning",
    details: "User revoked all active sessions.",
  }).catch(() => null);
  revalidatePath("/settings/security");
  return { success: true };
}

export async function revokeUserSessionsByAdminAction(userId: string) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const membership = await prisma.organizationUser.findFirst({
    where: { organizationId: ctx.organizationId, userId },
    select: { userId: true },
  });

  if (!membership) {
    return { error: "This user is not part of your workspace." };
  }

  await revokeAllUserSessions(userId);
  await writeAuditLog(ctx, "REVOKE_USER_SESSIONS_ADMIN", "UserSecurityProfile", userId, "Administrator revoked all sessions for a workspace user.");
  await logSecurityEvent({
    userId,
    organizationId: ctx.organizationId,
    type: "auth.session.revoked_admin",
    status: "warning",
    details: `Workspace administrator ${ctx.userId} revoked active sessions for this account.`,
  }).catch(() => null);
  revalidatePath("/settings/security");
  return { success: true };
}

export async function completeTwoFactorSignInAction(rawData: {
  challengeToken: string;
  verificationCode: string;
  rememberDevice?: boolean;
}) {
  const parsed = verifyChallengeSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid verification code." };
  }

  try {
    const result = await verifySignInChallenge(parsed.data);
    await signIn("credentials", {
      challengeToken: parsed.data.challengeToken,
      redirectTo: result.redirectTo,
    });
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return { error: "The security challenge could not be completed. Please sign in again." };
    }
    return { error: error instanceof Error ? error.message : "We couldn't complete the security challenge." };
  }
}

export async function updateTenantSecurityPolicyAction(rawData: unknown) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const parsed = securityPolicySchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Security policy values are invalid." };
  }

  const policy = await updateOrganizationSecurityPolicy({
    organizationId: ctx.organizationId,
    updatedById: ctx.userId,
    data: parsed.data,
  });

  const memberIds = (
    await prisma.organizationUser.findMany({
      where: { organizationId: ctx.organizationId },
      select: { userId: true },
    })
  ).map((member) => member.userId);

  const existingProfiles = await prisma.userSecurityProfile.findMany({
    where: { userId: { in: memberIds } },
    select: { userId: true },
  });

  const existingUserIds = new Set(existingProfiles.map((profile) => profile.userId));
  await prisma.$transaction([
    ...memberIds
      .filter((userId) => existingUserIds.has(userId))
      .map((userId) =>
        prisma.userSecurityProfile.update({
          where: { userId },
          data: { sessionVersion: { increment: 1 } },
        }),
      ),
    ...memberIds
      .filter((userId) => !existingUserIds.has(userId))
      .map((userId) =>
        prisma.userSecurityProfile.create({
          data: { userId },
        }),
      ),
  ]);

  await writeAuditLog(ctx, "UPDATE_SECURITY_POLICY", "OrganizationSecurityPolicy", policy.id, "Updated tenant security policy and revoked active sessions.");
  await logSecurityEvent({
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    type: "auth.policy.updated",
    status: "warning",
    details: "Tenant security policy updated.",
    metadata: {
      requireTwoFactorForAllUsers: parsed.data.requireTwoFactorForAllUsers,
      requireTwoFactorForPrivileged: parsed.data.requireTwoFactorForPrivileged,
      enforcePasskeysForAdmins: parsed.data.enforcePasskeysForAdmins,
      idleTimeoutMinutes: parsed.data.idleTimeoutMinutes,
      absoluteSessionLifetimeMinutes: parsed.data.absoluteSessionLifetimeMinutes,
    },
  }).catch(() => null);

  revalidatePath("/settings/security");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getSecurityPageData() {
  const ctx = await getCurrentTenantContext();
  const overview = await getUserSecurityOverview(ctx.userId, ctx.organizationId);
  return { ctx, overview };
}
