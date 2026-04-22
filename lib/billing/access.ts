import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/tenant";
import { addDays, isAfter } from "date-fns";

const PAID_GRACE_DAYS = 15;

export type OrganizationAccessStatus =
  | "unverified"
  | "verified"
  | "onboarding"
  | "payment_pending"
  | "active"
  | "grace_period"
  | "expired"
  | "blocked";

export class ErpAccessError extends Error {
  readonly status: OrganizationAccessStatus;

  constructor(status: OrganizationAccessStatus, message?: string) {
    super(message ?? `ERP access is not available while organization is ${status}.`);
    this.name = "ErpAccessError";
    this.status = status;
  }
}

export async function getOrganizationAccessState(orgId: string): Promise<{
  status: OrganizationAccessStatus;
  warning?: string;
  redirectTo?: string;
  graceEndsAt?: Date | null;
}> {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { subscription: true },
  });

  if (!organization) return { status: "blocked", redirectTo: "/auth/signin" };

  const now = new Date();
  if (organization.accessStatus === "blocked" || organization.blockedAt) {
    return { status: "blocked", redirectTo: "/settings/billing" };
  }

  if (organization.isDemoTenant) {
    if (organization.demoExpiresAt && isAfter(now, organization.demoExpiresAt)) {
      await prisma.organization.update({
        where: { id: orgId },
        data: { accessStatus: "expired", lifecycleStatus: "blocked", blockedAt: now },
      });
      return { status: "expired", redirectTo: "/settings/billing" };
    }
    return { status: organization.accessStatus as OrganizationAccessStatus };
  }

  const sub = organization.subscription;
  if (!sub) return { status: organization.accessStatus as OrganizationAccessStatus, redirectTo: "/onboarding/packages" };

  if (sub.paymentStatus === "payment_pending" || sub.status === "payment_pending") {
    return { status: "payment_pending", redirectTo: "/onboarding/packages" };
  }
  if (sub.paymentStatus === "failed" || sub.status === "failed") {
    return { status: "blocked", redirectTo: "/settings/billing" };
  }

  if (sub.currentPeriodEnd && isAfter(now, sub.currentPeriodEnd)) {
    const graceEndsAt = sub.graceEndsAt ?? organization.graceEndsAt ?? addDays(sub.currentPeriodEnd, PAID_GRACE_DAYS);
    if (isAfter(now, graceEndsAt)) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { organizationId: orgId },
          data: { status: "expired", accessStatus: "expired", expiredAt: sub.expiredAt ?? now, blockedAt: now },
        }),
        prisma.organization.update({
          where: { id: orgId },
          data: { accessStatus: "expired", lifecycleStatus: "blocked", blockedAt: now, graceEndsAt },
        }),
      ]);
      return { status: "expired", redirectTo: "/settings/billing", graceEndsAt };
    }

    if (sub.accessStatus !== "grace_period" || !sub.graceEndsAt) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { organizationId: orgId },
          data: { accessStatus: "grace_period", graceEndsAt, expiredAt: sub.expiredAt ?? now },
        }),
        prisma.organization.update({
          where: { id: orgId },
          data: { accessStatus: "grace_period", graceEndsAt },
        }),
      ]);
    }
    return {
      status: "grace_period",
      warning: `Your subscription is expired. Access continues until ${graceEndsAt.toLocaleDateString()}.`,
      graceEndsAt,
    };
  }

  const status = (sub.accessStatus || organization.accessStatus || "payment_pending") as OrganizationAccessStatus;
  return { status, graceEndsAt: sub.graceEndsAt };
}

export async function assertErpAccess(ctx: TenantContext) {
  const state = await getOrganizationAccessState(ctx.organizationId);
  if (state.status !== "active" && state.status !== "grace_period") {
    throw new ErpAccessError(state.status);
  }
  return state;
}

export async function assertPackageLimit(ctx: TenantContext, limitType: "userLimit") {
  const assignment = await prisma.organizationPackage.findUnique({
    where: { organizationId: ctx.organizationId },
    include: { package: true },
  });
  if (!assignment) return;

  const limit = assignment.customUserLimit ?? assignment.package.userLimit;
  if (limitType === "userLimit") {
    const users = await prisma.organizationUser.count({ where: { organizationId: ctx.organizationId } });
    if (users >= limit) {
      throw new Error(`Package user limit reached. Current package allows ${limit} users.`);
    }
  }
}
