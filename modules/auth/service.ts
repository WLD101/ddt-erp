/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { triggerLifecycleEmail } from "../emails/service";
import { trackEvent, AnalyticCategory } from "../analytics/service";
import { createOpaqueToken, hashToken } from "@/lib/security/tokens";
import { getDefaultEnabledModuleIds, resolveIndustryProfileFromLegacyIndustry } from "../onboarding/industry-profiles";
import { getCurrencyForCountry } from "@/lib/country-currency";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  referralCode: z.string().optional(),
  industry: z.string().optional(),
  mode: z.enum(["demo", "trial", "paid"]).optional().default("trial"),
});

export const joinSchema = z.object({
  token: z.string(),
  name: z.string().min(2),
  password: z.string().min(8),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type JoinInput = z.infer<typeof joinSchema>;

/**
 * SERVICE: REGISTER NEW USER & ORGANIZATION (BOOTSTRAP)
 * Note: Uses raw prisma as organization context does not exist yet.
 */
export async function bootstrapOrganization(data: SignUpInput) {
  const { name, phone, password, organizationName, city, country, referralCode, industry, mode } = data;
  const email = data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists with this email.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const organizationSlug = organizationName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const existingSlugCount = await prisma.organization.count({
    where: {
      slug: {
        startsWith: organizationSlug,
      },
    },
  });

  const resolvedSlug = existingSlugCount === 0 ? organizationSlug : `${organizationSlug}-${existingSlugCount + 1}`;
  const defaultCurrency = getCurrencyForCountry(country);
  const now = new Date();
  let referralId: string | undefined;

  if (referralCode) {
    const partner = await prisma.partner.findFirst({
      where: { partnerCode: referralCode, status: "ACTIVE" }
    });
    if (partner) {
      const referral = await prisma.referral.create({
        data: { partnerId: partner.id }
      });
      referralId = referral.id;
    }
  }

  const isDemoOrTrial = mode === "demo" || mode === "trial";
  const trialDays = 7;
  const demoExpiresAt = isDemoOrTrial ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;
  const resolvedIndustryProfileKey = resolveIndustryProfileFromLegacyIndustry(industry || null);

  const { user, organization: org } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        authStatus: "verified",
        verifiedAt: now,
        emailVerified: now,
        isDemoUser: isDemoOrTrial,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug: resolvedSlug,
        phone,
        email,
        city,
        country,
        currency: defaultCurrency,
        industry,
        industryType: industry,
        industryProfileKey: resolvedIndustryProfileKey,
        enabledModules: resolvedIndustryProfileKey ? getDefaultEnabledModuleIds(resolvedIndustryProfileKey).join(",") : null,
        lifecycleStatus: isDemoOrTrial ? mode : "onboarding",
        accessStatus: isDemoOrTrial ? "active" : "onboarding",
        isDemoTenant: isDemoOrTrial,
        demoExpiresAt,
        referralId,
        subscription: {
          create: {
            planId: "unassigned",
            status: isDemoOrTrial ? "trialing" : "payment_pending",
            paymentStatus: isDemoOrTrial ? "demo" : "payment_pending",
            accessStatus: isDemoOrTrial ? "active" : "payment_pending",
            billingSource: isDemoOrTrial ? "demo" : null,
            currentPeriodStart: now,
            currentPeriodEnd: isDemoOrTrial ? demoExpiresAt : now,
          }
        }
      },
    });

    return { user, organization };
  });

  const {
    seedPermissions,
    initializeTenantRoles,
    initializeTenantBranches,
    initializeTenantFinances
  } = await import("@/lib/security/seed");

  await seedPermissions();
  await initializeTenantRoles(org.id);
  await initializeTenantBranches(org.id);
  await initializeTenantFinances(org.id);

  const ownerRole = await prisma.role.findUnique({
    where: {
      name_organizationId: {
        name: "owner",
        organizationId: org.id,
      },
    },
  });

  if (!ownerRole) {
    throw new Error("Failed to initialize roles");
  }

  await prisma.$transaction([
    prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        roleId: ownerRole.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        action: "INITIAL_SIGNUP",
        entityType: "Organization",
        entityId: org.id,
        details: `User created organization: ${organizationName}`,
      },
    }),
  ]);

  void trackEvent({
    name: "SIGNUP_COMPLETED",
    category: AnalyticCategory.AUTH,
    userId: user.id,
    organizationId: org.id
  });

  await triggerLifecycleEmail(user.id, org.id, "WELCOME").catch(err => {
    console.error("[Lifecycle Error] Failed to send welcome email:", err);
  });

  return { user, organization: org };
}

/**
 * SERVICE: JOIN EXISTING ORGANIZATION VIA INVITE
 */
export async function joinByInvitation(data: JoinInput) {
  const { token, name, password } = data;

  const invite = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invite || (invite.expires && invite.expires < new Date()) || invite.acceptedAt) {
    throw new Error("Invalid, expired, or already used invitation.");
  }

  // ENFORCE USER LIMITS
  const { assertPlanLimit } = await import("@/lib/billing/enforcement");
  await assertPlanLimit(invite.organizationId, "maxUsers");

  const hashedPassword = await bcrypt.hash(password, 12);

  return prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({
      where: { email: invite.email },
    });

    if (!user) {
      user = await tx.user.create({
        data: {
          email: invite.email,
          name,
          password: hashedPassword,
        },
      });
    } else {
      await tx.user.update({
        where: { id: user.id },
        data: { name, password: hashedPassword },
      });
    }

    await tx.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: invite.organizationId,
        roleId: invite.roleId,
      },
    });

    await tx.invitation.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        organizationId: invite.organizationId,
        userId: user.id,
        action: "ACCEPTED_INVITATION",
        entityType: "Organization",
        entityId: invite.organizationId,
        details: `User joined org via invite token`,
      },
    });

    return { user, organizationId: invite.organizationId };
  });
}

/**
 * SERVICE: PASSWORD RESET REQUEST
 */
export async function requestPasswordReset(email: string, isVoice = false) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return true;

  const { token, tokenHash } = createOpaqueToken();
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    }),
    prisma.passwordResetToken.create({
      data: { email: normalizedEmail, token: tokenHash, expires },
    }),
  ]);

  await triggerLifecycleEmail(user.id, null, "PASSWORD_RESET", { token, isVoice }).catch((error) => {
    console.error("[PasswordReset] Email dispatch failed:", error);
  });

  return true;
}

/**
 * SERVICE: RESET PASSWORD EXECUTION
 */
export async function resetPassword(token: string, password: string) {
  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });
  if (!resetToken || resetToken.expires < new Date()) {
    throw new Error("Invalid or expired reset token.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword }
    }),
    prisma.passwordResetToken.deleteMany({ where: { email: resetToken.email } })
  ]);

  return true;
}
