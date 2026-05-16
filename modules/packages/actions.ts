"use server";

import { inferPlanIdFromPackage } from "@/lib/billing/catalog";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext } from "@/lib/tenant";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { PLAN_ORDER, PLANS } from "@/lib/billing/plans";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";

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
    
    const existing = await prisma.package.findFirst({
      where: { name: plan.name },
    });

    const defaultMeta = {
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
      // New discount fields
      originalMonthlyPrice: null,
      discountedMonthlyPrice: null,
      monthlyDiscountLabel: null,
      originalYearlyPrice: null,
      discountedYearlyPrice: null,
      yearlyDiscountLabel: null,
      discountEnabled: false,
    };

    if (existing) {
      let existingMeta: any = {};
      try {
        existingMeta = JSON.parse(existing.featureJson);
      } catch {}

      // Merge: Keep existing editable values, update everything else from static config
      const mergedMeta = {
        ...defaultMeta,
        ...existingMeta,
        // Always sync these from static config if they change in code
        modules: plan.includedModules,
        features: plan.features,
        supportLabel: plan.supportLabel,
      };

      await prisma.package.update({
        where: { id: existing.id },
        data: {
          businessSize: plan.audience,
          userLimit: plan.limits.maxUsers,
          featureJson: JSON.stringify(mergedMeta),
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
        featureJson: JSON.stringify(defaultMeta),
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
    demoMode: z.boolean().optional(),
  });
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { error: "Invalid package selection." };

  const organization = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { isDemoTenant: true, lifecycleStatus: true },
  });

  if (parsed.data.enterprise) {
    await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: { lifecycleStatus: "enterprise_pending", accessStatus: "payment_pending" },
    });
    return { status: "enterprise_pending", redirectTo: "/settings/billing" };
  }

  if (!parsed.data.packageId) return { error: "No package selected." };

  const pkg = await prisma.package.findUnique({ where: { id: parsed.data.packageId } });
  if (!pkg) return { error: "Package not found." };

  const planId = inferPlanIdFromPackage(pkg);

  await prisma.organizationPackage.upsert({
    where: { organizationId: ctx.organizationId },
    update: { packageId: pkg.id, assignedAt: new Date() },
    create: { organizationId: ctx.organizationId, packageId: pkg.id },
  });

  if (parsed.data.demoMode) {
    const now = new Date();
    const demoExpiresAt = addDays(now, 7);

    await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: {
        isDemoTenant: true,
        lifecycleStatus: "demo",
        accessStatus: "active",
        activatedAt: now,
        blockedAt: null,
        graceEndsAt: null,
        demoExpiresAt,
      },
    });

    await prisma.subscription.upsert({
      where: { organizationId: ctx.organizationId },
      update: {
        packageId: pkg.id,
        planId,
        status: "trialing",
        paymentStatus: "demo",
        accessStatus: "active",
        billingSource: "demo",
        currentPeriodStart: now,
        currentPeriodEnd: demoExpiresAt,
        activatedAt: now,
        blockedAt: null,
        expiredAt: null,
        graceEndsAt: null,
      },
      create: {
        organizationId: ctx.organizationId,
        packageId: pkg.id,
        planId,
        status: "trialing",
        paymentStatus: "demo",
        accessStatus: "active",
        billingSource: "demo",
        currentPeriodStart: now,
        currentPeriodEnd: demoExpiresAt,
        activatedAt: now,
      },
    });

    return { status: "demo_activated", redirectTo: "/dashboard" };
  }

  await prisma.subscription.upsert({
    where: { organizationId: ctx.organizationId },
    update: { packageId: pkg.id, planId },
    create: {
      organizationId: ctx.organizationId,
      packageId: pkg.id,
      planId,
      status: "payment_pending",
      paymentStatus: "payment_pending",
      accessStatus: "payment_pending",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    },
  });

  return { status: "package_selected", redirectTo: "/settings/billing" };
}

export async function markSubscriptionPaymentSuccessAction(organizationId: string) {
  const session = await requirePlatformAdmin();
  const now = new Date();

  await prisma.$transaction([
    prisma.subscription.update({
      where: { organizationId },
      data: {
        status: "active",
        paymentStatus: "paid",
        accessStatus: "active",
        billingSource: "manual",
        activatedAt: now,
        blockedAt: null,
        expiredAt: null,
        graceEndsAt: null,
      },
    }),
    prisma.organization.update({
      where: { id: organizationId },
      data: {
        accessStatus: "active",
        lifecycleStatus: "active",
        activatedAt: now,
        blockedAt: null,
        graceEndsAt: null,
        isDemoTenant: false,
      },
    }),
  ]);

  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "MANUAL_PAYMENT_APPROVED",
    entityType: "Subscription",
    entityId: organizationId,
    details: `Approved manual payment and activated subscription for organization ${organizationId}.`,
  });

  revalidatePath("/wq-command-center");
  revalidatePath("/settings/billing");
}

export async function markSubscriptionPaymentFailedAction(organizationId: string) {
  const session = await requirePlatformAdmin();
  const now = new Date();

  await prisma.$transaction([
    prisma.subscription.update({
      where: { organizationId },
      data: {
        status: "failed",
        paymentStatus: "failed",
        accessStatus: "blocked",
        blockedAt: now,
      },
    }),
    prisma.organization.update({
      where: { id: organizationId },
      data: {
        accessStatus: "blocked",
        lifecycleStatus: "blocked",
        blockedAt: now,
      },
    }),
  ]);

  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "MANUAL_PAYMENT_FAILED",
    entityType: "Subscription",
    entityId: organizationId,
    details: `Marked manual payment as failed for organization ${organizationId}.`,
  });

  revalidatePath("/wq-command-center");
  revalidatePath("/settings/billing");
}
