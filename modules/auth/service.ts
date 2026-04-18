import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { triggerLifecycleEmail } from "../emails/service";
import { trackEvent, AnalyticCategory } from "../analytics/service";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  referralCode: z.string().optional(),
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
  const { name, email, password, organizationName, referralCode } = data;

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

  return prisma.$transaction(async (tx) => {
    // 0. Resolve Referral if code provided
    let referralId: string | undefined;
    if (referralCode) {
      const partner = await tx.partner.findUnique({
        where: { partnerCode: referralCode, status: "ACTIVE" }
      });
      if (partner) {
        const referral = await tx.referral.create({
          data: { partnerId: partner.id }
        });
        referralId = referral.id;
      }
    }

    // 1. Create User
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 2. Create Organization with 14-Day Free Trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const org = await tx.organization.create({
      data: {
        name: organizationName,
        slug: organizationSlug,
        referralId,
        subscription: {
          create: {
            planId: "pro",
            status: "trialing",
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEnd,
          }
        }
      },
    });

    // 3. Initialize Tenant Infrastructure (Roles, Permissions, Branches)
    const { 
      seedPermissions, 
      initializeTenantRoles,
      initializeTenantBranches,
      initializeTenantFinances 
    } = await import("@/lib/security/seed");
    
    await seedPermissions(); // Sync granular manifest
    await initializeTenantRoles(org.id);
    await initializeTenantBranches(org.id);
    await initializeTenantFinances(org.id);

    // 4. Link User to Organization as Owner
    const ownerRole = await tx.role.findUnique({
      where: {
        name_organizationId: {
          name: "owner",
          organizationId: org.id,
        },
      },
    });

    if (!ownerRole) throw new Error("Failed to initialize roles");

    await tx.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        roleId: ownerRole.id,
      },
    });

    // 5. Initial Audit Log
    await tx.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        action: "INITIAL_SIGNUP",
        entityType: "Organization",
        entityId: org.id,
        details: `User created organization: ${organizationName}`,
      },
    });

    // 6. Analytics: Record Success
    void trackEvent({
        name: "SIGNUP_COMPLETED",
        category: AnalyticCategory.AUTH,
        userId: user.id,
        organizationId: org.id
    });

    // 7. Trigger Welcome Email
    await triggerLifecycleEmail(user.id, org.id, "WELCOME").catch(err => {
        console.error("[Lifecycle Error] Failed to send welcome email:", err);
    });

    return { user, organization: org };
  });
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
