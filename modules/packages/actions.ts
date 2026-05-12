"use server";

import { inferPlanIdFromPackage } from "@/lib/billing/catalog";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext } from "@/lib/tenant";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { PLAN_ORDER, PLANS } from "@/lib/billing/plans";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";

const packageSchema = z.object({
  name: z.string().min(2).max(120),
  businessSize: z.string().max(120).optional(),
  userLimit: z.number().int().min(1).max(999999),
  featureJson: z.string().default("{}"),
  isCustom: z.boolean().default(false),
});

const assignPackageSchema = z.object({
  organizationId: z.string().min(1),
  packageId: z.string().min(1),
  customUserLimit: z.number().int().min(1).optional(),
  customFeatureJson: z.string().optional(),
});

export async function ensureDefaultPackages() {
  for (const planId of PLAN_ORDER) {
    const plan = PLANS[planId];
    const featureJson = JSON.stringify({
      planId: plan.id,
      currency: plan.price.currency,
      monthlyPrice: plan.price.monthly,
      displayPrice: `${plan.price.display}${plan.price.cadence}`,
      branchLimit: plan.limits.maxBranches,
      productLimit: plan.limits.maxProducts,
      monthlyInvoiceLimit: plan.limits.maxMonthlyInvoices,
      integrationsLimit: plan.limits.maxIntegrations,
      modules: plan.includedModules,
      features: plan.features,
      supportLabel: plan.supportLabel,
      tagline: plan.tagline,
    });

    const existing = await prisma.package.findFirst({
      where: { name: plan.name },
      select: { id: true },
    });

    if (existing) {
      await prisma.package.update({
        where: { id: existing.id },
        data: {
          businessSize: plan.audience,
          userLimit: plan.limits.maxUsers,
          featureJson,
          isCustom: plan.id === "enterprise",
          isActive: true,
        },
      });
      continue;
    }

    await prisma.package.create({
      data: {
        name: plan.name,
        businessSize: plan.audience,
        userLimit: plan.limits.maxUsers,
        featureJson,
        isCustom: plan.id === "enterprise",
      },
    });
  }
}

export async function getActivePackages() {
  await ensureDefaultPackages();
  return prisma.package.findMany({
    where: { isActive: true },
    orderBy: [{ isCustom: "asc" }, { createdAt: "asc" }],
  });
}

export async function getPlatformPackages() {
  await requirePlatformAdmin();
  await ensureDefaultPackages();
  return prisma.package.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { assignments: true, subscriptions: true } } },
  });
}

export async function createPackageAction(data: unknown) {
  const session = await requirePlatformAdmin();
  const parsed = packageSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const pkg = await prisma.package.create({ data: parsed.data });
  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "PACKAGE_CREATED",
    entityType: "Package",
    entityId: pkg.id,
    details: `Created package ${pkg.name}.`,
  });
  revalidatePath("/platform/packages");
  return { success: true, data: pkg };
}

export async function updatePackageAction(id: string, data: unknown) {
  const session = await requirePlatformAdmin();
  const parsed = packageSchema.partial().safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const pkg = await prisma.package.update({ where: { id }, data: parsed.data });
  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "PACKAGE_UPDATED",
    entityType: "Package",
    entityId: pkg.id,
    details: `Updated package ${pkg.name}.`,
  });
  revalidatePath("/platform/packages");
  return { success: true, data: pkg };
}

export async function deactivatePackageAction(id: string) {
  const session = await requirePlatformAdmin();
  const pkg = await prisma.package.update({ where: { id }, data: { isActive: false } });
  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "PACKAGE_DEACTIVATED",
    entityType: "Package",
    entityId: pkg.id,
    details: `Deactivated package ${pkg.name}.`,
  });
  revalidatePath("/platform/packages");
  return { success: true };
}

export async function assignPackageAction(data: unknown) {
  const session = await requirePlatformAdmin();
  const parsed = assignPackageSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const packageRecord = await prisma.package.findUnique({
    where: { id: input.packageId },
  });
  if (!packageRecord) return { error: "Package not found." };

  const planId = inferPlanIdFromPackage(packageRecord);

  const assignment = await prisma.organizationPackage.upsert({
    where: { organizationId: input.organizationId },
    update: {
      packageId: input.packageId,
      assignedById: session.user.id,
      customUserLimit: input.customUserLimit,
      customFeatureJson: input.customFeatureJson,
      assignedAt: new Date(),
    },
    create: {
      organizationId: input.organizationId,
      packageId: input.packageId,
      assignedById: session.user.id,
      customUserLimit: input.customUserLimit,
      customFeatureJson: input.customFeatureJson,
    },
  });

  await prisma.subscription.update({
    where: { organizationId: input.organizationId },
    data: { packageId: input.packageId, planId },
  }).catch(() => null);

  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "PACKAGE_ASSIGNED",
    entityType: "OrganizationPackage",
    entityId: assignment.id,
    details: `Assigned package ${input.packageId} to organization ${input.organizationId}.`,
  });
  revalidatePath("/platform/tenants");
  return { success: true, data: assignment };
}

export async function selectPackageAction(data: unknown) {
  const ctx = await getCurrentTenantContext();
  const schema = z.object({
    packageId: z.string().optional(),
    enterprise: z.boolean().optional(),
  });
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { error: "Invalid package selection." };

  if (parsed.data.enterprise) {
    await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: { lifecycleStatus: "enterprise_pending", accessStatus: "payment_pending" },
    });
    await writePlatformAuditLog({
      actorId: ctx.userId,
      action: "ENTERPRISE_REQUESTED",
      entityType: "Organization",
      entityId: ctx.organizationId,
      details: "Tenant selected enterprise/custom package.",
    });
    return { success: true, status: "enterprise_pending" };
  }

  if (!parsed.data.packageId) return { error: "Package is required." };
  const pkg = await prisma.package.findFirst({ where: { id: parsed.data.packageId, isActive: true } });
  if (!pkg) return { error: "Package not found." };
  const planId = inferPlanIdFromPackage(pkg);

  await prisma.$transaction([
    prisma.organizationPackage.upsert({
      where: { organizationId: ctx.organizationId },
      update: { packageId: pkg.id, assignedAt: new Date() },
      create: { organizationId: ctx.organizationId, packageId: pkg.id },
    }),
    prisma.organization.update({
      where: { id: ctx.organizationId },
      data: { accessStatus: "payment_pending", lifecycleStatus: "onboarding" },
    }),
    prisma.subscription.update({
      where: { organizationId: ctx.organizationId },
      data: {
        packageId: pkg.id,
        planId,
        status: "payment_pending",
        paymentStatus: "payment_pending",
        accessStatus: "payment_pending",
      },
    }),
  ]);

  return { success: true, status: "payment_pending", redirectTo: planId === "enterprise" ? "/settings/billing" : "/checkout" };
}

export async function markSubscriptionPaymentSuccessAction(orgId: string) {
  const session = await requirePlatformAdmin();
  const now = new Date();
  const existing = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
    select: { billingCycle: true, currentPeriodEnd: true, billingSource: true },
  });
  const currentPeriodEnd =
    existing?.currentPeriodEnd && existing.currentPeriodEnd > now
      ? existing.currentPeriodEnd
      : existing?.billingCycle === "YEARLY"
        ? addMonths(now, 12)
        : addMonths(now, 1);
  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: { accessStatus: "active", lifecycleStatus: "active", activatedAt: now, blockedAt: null, isDemoTenant: false, demoExpiresAt: null },
    }),
    prisma.subscription.update({
      where: { organizationId: orgId },
      data: {
        status: "active",
        paymentStatus: "paid",
        accessStatus: "active",
        billingSource: existing?.billingSource === "demo" ? "manual" : existing?.billingSource || "manual",
        currentPeriodStart: now,
        currentPeriodEnd,
        activatedAt: now,
        blockedAt: null,
        expiredAt: null,
        graceEndsAt: null,
      },
    }),
  ]);
  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "PAYMENT_SUCCESS",
    entityType: "Organization",
    entityId: orgId,
    details: "Manual payment success recorded.",
  });
  revalidatePath("/platform/tenants");
  return { success: true };
}

export async function markSubscriptionPaymentFailedAction(orgId: string) {
  const session = await requirePlatformAdmin();
  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: { accessStatus: "blocked", lifecycleStatus: "blocked", blockedAt: new Date() },
    }),
    prisma.subscription.update({
      where: { organizationId: orgId },
      data: { status: "failed", paymentStatus: "failed", accessStatus: "blocked", billingSource: "manual", blockedAt: new Date() },
    }),
  ]);
  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "PAYMENT_FAILURE",
    entityType: "Organization",
    entityId: orgId,
    details: "Manual payment failure recorded.",
  });
  revalidatePath("/platform/tenants");
  return { success: true };
}
