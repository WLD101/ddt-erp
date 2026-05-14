"use server";

import { addDays, addMonths, addYears } from "date-fns";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { inferPlanIdFromPackage } from "@/lib/billing/catalog";
import { PLANS } from "@/lib/billing/plans";
import { getCurrencyForCountry } from "@/lib/country-currency";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/security/guards";
import {
  seedPermissions,
  initializeTenantBranches,
  initializeTenantFinances,
  initializeTenantRoles,
} from "@/lib/security/seed";
import { INDUSTRY_MODULES } from "@/modules/onboarding/service";
import {
  assignPackageAction,
  markSubscriptionPaymentFailedAction,
  markSubscriptionPaymentSuccessAction,
  updatePackageAction,
  ensureDefaultPackages,
} from "@/modules/packages/actions";

const billingCycleSchema = z.enum(["MONTHLY", "YEARLY", "CUSTOM"]);
const paymentMethodSchema = z.enum(["BANK_TRANSFER", "CASH", "INVOICE", "OTHER"]);
const packageModeSchema = z.enum(["standard", "custom"]);
const accountModeSchema = z.enum(["paid", "demo"]);
const subscriptionStatusSchema = z.enum(["active", "trialing", "payment_pending", "failed", "cancelled", "expired"]);
const paymentStatusSchema = z.enum(["paid", "payment_pending", "failed", "demo"]);
const planIdSchema = z.enum(["starter", "business", "pro", "enterprise"]);

const optionalDateSchema = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim()) return new Date(value);
  return undefined;
}, z.date().optional());

const updateOrganizationSchema = z.object({
  organizationId: z.string().min(1),
  country: z.string().min(2).max(120).optional(),
  currency: z.string().min(3).max(8).optional(),
});

const setStatusSchema = z.object({
  organizationId: z.string().min(1),
  status: z.enum(["active", "payment_pending", "blocked", "suspended", "grace_period", "expired"]),
});

const extendSubscriptionSchema = z.object({
  organizationId: z.string().min(1),
  days: z.coerce.number().int().min(1).max(365),
});

const assignPackageSchema = z.object({
  organizationId: z.string().min(1),
  packageId: z.string().min(1),
});

const updatePackageSchema = z.object({
  packageId: z.string().min(1),
  monthlyPrice: z.coerce.number().min(0).nullable(),
  branchLimit: z.coerce.number().int().min(1).max(999999),
  userLimit: z.coerce.number().int().min(1).max(999999),
  integrationsLimit: z.coerce.number().int().min(0).max(999999),
});

const createClientSchema = z
  .object({
    organizationName: z.string().min(2, "Organization name is required."),
    organizationPhone: z.string().max(40).optional(),
    ownerName: z.string().max(120).optional(),
    ownerEmail: z.string().email("Owner email is required."),
    country: z.string().min(2, "Country is required."),
    industry: z.enum(["wholesale", "ecommerce", "retail", "distribution", "manufacturing", "service_basic"]),
    packageId: planIdSchema,
    packageMode: packageModeSchema.default("standard"),
    accountMode: accountModeSchema.default("paid"),
    billingCycle: billingCycleSchema.default("MONTHLY"),
    renewalDate: optionalDateSchema,
    manualPaymentMethod: paymentMethodSchema.optional(),
    manualPaymentReference: z.string().max(200).optional(),
    adminNotes: z.string().max(1000).optional(),
    customPackageName: z.string().max(120).optional(),
    customPrice: z.coerce.number().min(0).optional(),
    customUserLimit: z.coerce.number().int().min(1).max(999999).optional(),
    customBranchLimit: z.coerce.number().int().min(1).max(999999).optional(),
    customFeatures: z.string().max(4000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.packageMode === "custom") {
      if (!data.customPackageName?.trim()) {
        ctx.addIssue({ code: "custom", path: ["customPackageName"], message: "Custom package name is required." });
      }
      if (typeof data.customUserLimit !== "number") {
        ctx.addIssue({ code: "custom", path: ["customUserLimit"], message: "Custom user limit is required." });
      }
      if (typeof data.customBranchLimit !== "number") {
        ctx.addIssue({ code: "custom", path: ["customBranchLimit"], message: "Custom branch limit is required." });
      }
    }
    if (data.billingCycle === "CUSTOM" && !data.renewalDate) {
      ctx.addIssue({ code: "custom", path: ["renewalDate"], message: "Custom billing requires an expiry date." });
    }
  });

const updateTenantBillingSchema = z
  .object({
    organizationId: z.string().min(1),
    packageId: z.string().min(1),
    packageMode: packageModeSchema.default("standard"),
    accountMode: accountModeSchema.default("paid"),
    billingCycle: billingCycleSchema.default("MONTHLY"),
    renewalDate: optionalDateSchema,
    subscriptionStatus: subscriptionStatusSchema.default("active"),
    paymentStatus: paymentStatusSchema.default("paid"),
    manualPaymentMethod: paymentMethodSchema.optional(),
    manualPaymentReference: z.string().max(200).optional(),
    adminNotes: z.string().max(1000).optional(),
    customPackageName: z.string().max(120).optional(),
    customPrice: z.coerce.number().min(0).optional(),
    customUserLimit: z.coerce.number().int().min(1).max(999999).optional(),
    customBranchLimit: z.coerce.number().int().min(1).max(999999).optional(),
    customFeatures: z.string().max(4000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.packageMode === "custom") {
      if (!data.customPackageName?.trim()) {
        ctx.addIssue({ code: "custom", path: ["customPackageName"], message: "Custom package name is required." });
      }
      if (typeof data.customUserLimit !== "number") {
        ctx.addIssue({ code: "custom", path: ["customUserLimit"], message: "Custom user limit is required." });
      }
      if (typeof data.customBranchLimit !== "number") {
        ctx.addIssue({ code: "custom", path: ["customBranchLimit"], message: "Custom branch limit is required." });
      }
    }
    if (data.billingCycle === "CUSTOM" && !data.renewalDate) {
      ctx.addIssue({ code: "custom", path: ["renewalDate"], message: "Custom billing requires an expiry date." });
    }
  });

export type CreateClientState = {
  success: boolean;
  message: string;
  email?: string;
  temporaryPassword?: string;
};

type BillingCycle = z.infer<typeof billingCycleSchema>;
type AccountMode = z.infer<typeof accountModeSchema>;
type PaymentStatusValue = z.infer<typeof paymentStatusSchema>;
type SubscriptionStatusValue = z.infer<typeof subscriptionStatusSchema>;

function normalizeFeatureList(input?: string) {
  if (!input) return [];
  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolvePeriodEnd(now: Date, billingCycle: BillingCycle, renewalDate?: Date) {
  if (renewalDate) return renewalDate;
  if (billingCycle === "YEARLY") return addYears(now, 1);
  if (billingCycle === "CUSTOM") return addMonths(now, 1);
  return addMonths(now, 1);
}

function getBillingSource(accountMode: AccountMode) {
  return accountMode === "demo" ? "demo" : "manual";
}

function getEffectivePaymentStatus(accountMode: AccountMode, paymentStatus: PaymentStatusValue) {
  return accountMode === "demo" ? "demo" : paymentStatus;
}

function getEffectiveSubscriptionStatus(accountMode: AccountMode, subscriptionStatus: SubscriptionStatusValue) {
  return accountMode === "demo" ? "trialing" : subscriptionStatus;
}

function deriveAccessState(input: {
  accountMode: AccountMode;
  subscriptionStatus: SubscriptionStatusValue;
  paymentStatus: PaymentStatusValue;
}) {
  const subscriptionStatus = getEffectiveSubscriptionStatus(input.accountMode, input.subscriptionStatus);
  const paymentStatus = getEffectivePaymentStatus(input.accountMode, input.paymentStatus);

  if (input.accountMode === "demo") {
    return {
      subscriptionStatus,
      paymentStatus,
      subscriptionAccessStatus: "active",
      organizationAccessStatus: "active",
      lifecycleStatus: "active",
      isDemoTenant: true,
    };
  }

  if (subscriptionStatus === "cancelled" || subscriptionStatus === "expired") {
    return {
      subscriptionStatus,
      paymentStatus,
      subscriptionAccessStatus: "expired",
      organizationAccessStatus: "expired",
      lifecycleStatus: "blocked",
      isDemoTenant: false,
    };
  }

  if (subscriptionStatus === "failed" || paymentStatus === "failed") {
    return {
      subscriptionStatus: subscriptionStatus === "failed" ? "failed" : subscriptionStatus,
      paymentStatus: "failed",
      subscriptionAccessStatus: "blocked",
      organizationAccessStatus: "blocked",
      lifecycleStatus: "blocked",
      isDemoTenant: false,
    };
  }

  if (subscriptionStatus === "payment_pending" || paymentStatus === "payment_pending") {
    return {
      subscriptionStatus: "payment_pending",
      paymentStatus: "payment_pending",
      subscriptionAccessStatus: "payment_pending",
      organizationAccessStatus: "payment_pending",
      lifecycleStatus: "onboarding",
      isDemoTenant: false,
    };
  }

  return {
    subscriptionStatus,
    paymentStatus,
    subscriptionAccessStatus: "active",
    organizationAccessStatus: "active",
    lifecycleStatus: "active",
    isDemoTenant: false,
  };
}

function buildCustomFeatureJson(customFeatures?: string) {
  const featureList = normalizeFeatureList(customFeatures);
  return featureList.length ? JSON.stringify({ featureList }) : null;
}

function createOrganizationSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveOwnerName(email: string) {
  const local = email.split("@")[0] || "Workspace Owner";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCreateClientError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (/unique constraint|already exists|duplicate/i.test(message)) {
    return "A client with the same organization or owner details already exists. Please change the organization name or owner email and try again.";
  }

  if (/package/i.test(message)) {
    return "The selected package could not be assigned. Please verify the package catalog and try again.";
  }

  if (/owner role setup failed/i.test(message)) {
    return "The workspace was created, but owner role setup failed. Please review tenant role seeding and try again.";
  }

  if (/branch|membership|subscription|organization/i.test(message)) {
    return message;
  }

  return "Failed to create client workspace. Please review the organization, user, package, and subscription setup and try again.";
}

export async function getCommandCenterSnapshot() {
  await requirePlatformAdmin();

  const [tenants, packages, audits, paymentAgg, demoLeadCount, activatedDemoCount, customPackageCount, enterprisePendingCount] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscription: true,
        organizationPackage: { include: { package: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        _count: {
          select: {
            members: true,
            branches: true,
            products: true,
            salesInvoices: true,
          },
        },
      },
    }),
    prisma.package.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.platformAuditLog.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
    }),
    prisma.lead.count({
      where: { source: "DEMO" },
    }),
    prisma.lead.count({
      where: { source: "DEMO", demoStatus: "ACTIVATED" },
    }),
    prisma.organizationPackage.count({
      where: { isCustomPackage: true },
    }),
    prisma.organization.count({
      where: { lifecycleStatus: "enterprise_pending" },
    }),
  ]);

  const countryBreakdown = Object.entries(
    tenants.reduce<Record<string, number>>((acc, tenant) => {
      const key = tenant.country?.trim() || "Unspecified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);

  const businessTypeBreakdown = Object.entries(
    tenants.reduce<Record<string, number>>((acc, tenant) => {
      const key = tenant.industryType?.trim() || tenant.industry?.trim() || "Unspecified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);

  const collectedRevenue = paymentAgg._sum.amount ?? 0;
  const demoRegistrationRatio = demoLeadCount > 0 ? Math.round((activatedDemoCount / demoLeadCount) * 100) : 0;

  return {
      tenants,
      packages,
      audits,
      insights: {
        collectedRevenue,
        erpsOnboarded: tenants.filter((tenant) => !tenant.isDemoTenant).length,
        demoLeadCount,
        activatedDemoCount,
        demoRegistrationRatio,
        customRequests: customPackageCount + enterprisePendingCount,
        countryBreakdown,
        businessTypeBreakdown,
      },
    };
  }

export async function updateOrganizationAdminAction(formData: FormData) {
  const session = await requirePlatformAdmin();
  const parsed = updateOrganizationSchema.safeParse({
    organizationId: formData.get("organizationId"),
    country: formData.get("country") || undefined,
    currency: formData.get("currency") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid organization update.");
  }

  const { organizationId, country, currency } = parsed.data;
  const resolvedCurrency = currency || getCurrencyForCountry(country);

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      country,
      currency: resolvedCurrency,
    },
  });

  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "ORG_PROFILE_UPDATED",
    entityType: "Organization",
    entityId: organizationId,
    details: `Updated organization locale settings to ${country || "unchanged"} / ${resolvedCurrency}.`,
  });

  revalidatePath("/wq-command-center");
}

export async function setOrganizationStatusAction(formData: FormData) {
  const session = await requirePlatformAdmin();
  const parsed = setStatusSchema.safeParse({
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid organization status.");
  }

  const { organizationId, status } = parsed.data;
  const blocked = status === "blocked" || status === "suspended" || status === "expired";

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: organizationId },
      data: {
        accessStatus: status,
        lifecycleStatus: blocked ? "blocked" : status === "payment_pending" ? "onboarding" : "active",
        blockedAt: blocked ? new Date() : null,
      },
    }),
    prisma.subscription.updateMany({
      where: { organizationId },
      data: {
        accessStatus: status,
        status: status === "payment_pending" ? "payment_pending" : status,
        blockedAt: blocked ? new Date() : null,
      },
    }),
  ]);

  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "ORG_STATUS_UPDATED",
    entityType: "Organization",
    entityId: organizationId,
    details: `Set organization access status to ${status}.`,
  });

  revalidatePath("/wq-command-center");
}

export async function extendOrganizationSubscriptionAction(formData: FormData) {
  const session = await requirePlatformAdmin();
  const parsed = extendSubscriptionSchema.safeParse({
    organizationId: formData.get("organizationId"),
    days: formData.get("days"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid extension request.");
  }

  const { organizationId, days } = parsed.data;
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription) {
    throw new Error("Subscription not found for this organization.");
  }

  const baseDate =
    subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()
      ? subscription.currentPeriodEnd
      : new Date();
  const nextPeriodEnd = addDays(baseDate, days);

  await prisma.$transaction([
    prisma.subscription.update({
      where: { organizationId },
      data: {
        currentPeriodEnd: nextPeriodEnd,
        graceEndsAt: null,
        blockedAt: null,
        expiredAt: null,
        accessStatus: "active",
        status: subscription.status === "trialing" ? "trialing" : "active",
        paymentStatus: subscription.paymentStatus === "payment_pending" ? "paid" : subscription.paymentStatus,
      },
    }),
    prisma.organizationPackage.updateMany({
      where: { organizationId },
      data: { customExpiryDate: nextPeriodEnd },
    }),
    prisma.organization.update({
      where: { id: organizationId },
      data: {
        accessStatus: "active",
        lifecycleStatus: "active",
        graceEndsAt: null,
        blockedAt: null,
        demoExpiresAt: subscription.billingSource === "demo" ? nextPeriodEnd : null,
      },
    }),
  ]);

  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "SUBSCRIPTION_EXTENDED",
    entityType: "Subscription",
    entityId: organizationId,
    details: `Extended subscription by ${days} days.`,
  });

  revalidatePath("/wq-command-center");
}

export async function assignPackageFromCommandCenterAction(formData: FormData) {
  const parsed = assignPackageSchema.safeParse({
    organizationId: formData.get("organizationId"),
    packageId: formData.get("packageId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid package assignment.");
  }

  const result = await assignPackageAction(parsed.data);
  if (!result.success) {
    throw new Error(result.error || "Package assignment failed.");
  }

  revalidatePath("/wq-command-center");
}

export async function approveManualPaymentFromCommandCenterAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  await markSubscriptionPaymentSuccessAction(organizationId);
  revalidatePath("/wq-command-center");
}

export async function failManualPaymentFromCommandCenterAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  await markSubscriptionPaymentFailedAction(organizationId);
  revalidatePath("/wq-command-center");
}

export async function updatePackageFromCommandCenterAction(formData: FormData) {
  await requirePlatformAdmin();
  const parsed = updatePackageSchema.safeParse({
    packageId: formData.get("packageId"),
    monthlyPrice: formData.get("monthlyPrice") ? Number(formData.get("monthlyPrice")) : null,
    branchLimit: Number(formData.get("branchLimit")),
    userLimit: Number(formData.get("userLimit")),
    integrationsLimit: Number(formData.get("integrationsLimit")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid package update.");
  }

  const existing = await prisma.package.findUnique({
    where: { id: parsed.data.packageId },
  });

  if (!existing) {
    throw new Error("Package not found.");
  }

  let currentFeatureJson: Record<string, unknown> = {};
  try {
    currentFeatureJson = existing.featureJson ? JSON.parse(existing.featureJson) : {};
  } catch {
    currentFeatureJson = {};
  }

  const featureJson = JSON.stringify({
    ...currentFeatureJson,
    monthlyPrice: parsed.data.monthlyPrice,
    displayPrice: parsed.data.monthlyPrice !== null ? `Rs. ${parsed.data.monthlyPrice.toLocaleString()}/month` : "Custom",
    branchLimit: parsed.data.branchLimit,
    integrationsLimit: parsed.data.integrationsLimit,
  });

  const result = await updatePackageAction(parsed.data.packageId, {
    userLimit: parsed.data.userLimit,
    featureJson,
  });

  if (!result.success) {
    throw new Error(result.error || "Package update failed.");
  }

  revalidatePath("/wq-command-center");
}

export async function updateTenantBillingFromCommandCenterAction(formData: FormData) {
  const session = await requirePlatformAdmin();
  const parsed = updateTenantBillingSchema.safeParse({
    organizationId: formData.get("organizationId"),
    packageId: formData.get("packageId"),
    packageMode: formData.get("packageMode"),
    accountMode: formData.get("accountMode"),
    billingCycle: formData.get("billingCycle"),
    renewalDate: formData.get("renewalDate") || undefined,
    subscriptionStatus: formData.get("subscriptionStatus"),
    paymentStatus: formData.get("paymentStatus"),
    manualPaymentMethod: formData.get("manualPaymentMethod") || undefined,
    manualPaymentReference: formData.get("manualPaymentReference") || undefined,
    adminNotes: formData.get("adminNotes") || undefined,
    customPackageName: formData.get("customPackageName") || undefined,
    customPrice: formData.get("customPrice") ? Number(formData.get("customPrice")) : undefined,
    customUserLimit: formData.get("customUserLimit") ? Number(formData.get("customUserLimit")) : undefined,
    customBranchLimit: formData.get("customBranchLimit") ? Number(formData.get("customBranchLimit")) : undefined,
    customFeatures: formData.get("customFeatures") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid billing update.");
  }

  const input = parsed.data;
  const now = new Date();
  const currentPeriodEnd = resolvePeriodEnd(now, input.billingCycle, input.renewalDate);
  const accessState = deriveAccessState({
    accountMode: input.accountMode,
    subscriptionStatus: input.subscriptionStatus,
    paymentStatus: input.paymentStatus,
  });
  const customFeatureJson = buildCustomFeatureJson(input.customFeatures);
  const packageRecord = await prisma.package.findUnique({
    where: { id: input.packageId },
    select: { id: true, name: true, featureJson: true, userLimit: true },
  });

  if (!packageRecord) {
    throw new Error("Selected package no longer exists.");
  }

  const planId = inferPlanIdFromPackage(packageRecord);

  await prisma.$transaction([
    prisma.organizationPackage.upsert({
      where: { organizationId: input.organizationId },
      update: {
        packageId: input.packageId,
        assignedById: session.user.id,
        customUserLimit: input.packageMode === "custom" ? input.customUserLimit : null,
        customBranchLimit: input.packageMode === "custom" ? input.customBranchLimit : null,
        customPackageName: input.packageMode === "custom" ? input.customPackageName?.trim() || null : null,
        customPrice: input.packageMode === "custom" ? input.customPrice ?? null : null,
        customBillingCycle: input.packageMode === "custom" ? input.billingCycle : null,
        customExpiryDate: input.packageMode === "custom" ? currentPeriodEnd : null,
        isCustomPackage: input.packageMode === "custom",
        customFeatureJson: input.packageMode === "custom" ? customFeatureJson : null,
        assignedAt: now,
      },
      create: {
        organizationId: input.organizationId,
        packageId: input.packageId,
        assignedById: session.user.id,
        customUserLimit: input.packageMode === "custom" ? input.customUserLimit : null,
        customBranchLimit: input.packageMode === "custom" ? input.customBranchLimit : null,
        customPackageName: input.packageMode === "custom" ? input.customPackageName?.trim() || null : null,
        customPrice: input.packageMode === "custom" ? input.customPrice ?? null : null,
        customBillingCycle: input.packageMode === "custom" ? input.billingCycle : null,
        customExpiryDate: input.packageMode === "custom" ? currentPeriodEnd : null,
        isCustomPackage: input.packageMode === "custom",
        customFeatureJson: input.packageMode === "custom" ? customFeatureJson : null,
      },
    }),
    prisma.subscription.update({
      where: { organizationId: input.organizationId },
      data: {
        packageId: input.packageId,
        planId,
        status: accessState.subscriptionStatus,
        paymentStatus: accessState.paymentStatus,
        accessStatus: accessState.subscriptionAccessStatus,
        billingCycle: input.billingCycle,
        billingSource: getBillingSource(input.accountMode),
        manualPaymentMethod: input.accountMode === "paid" ? input.manualPaymentMethod ?? null : null,
        manualPaymentReference: input.accountMode === "paid" ? input.manualPaymentReference?.trim() || null : null,
        adminNotes: input.adminNotes?.trim() || null,
        currentPeriodStart: now,
        currentPeriodEnd,
        activatedAt: accessState.organizationAccessStatus === "active" ? now : null,
        blockedAt: ["blocked", "expired"].includes(accessState.organizationAccessStatus) ? now : null,
        expiredAt: accessState.subscriptionStatus === "expired" || accessState.subscriptionStatus === "cancelled" ? now : null,
        graceEndsAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCheckoutSessionId: null,
        cancelAtPeriodEnd: false,
      },
    }),
    prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        isDemoTenant: accessState.isDemoTenant,
        accessStatus: accessState.organizationAccessStatus,
        lifecycleStatus: accessState.lifecycleStatus,
        demoExpiresAt: accessState.isDemoTenant ? currentPeriodEnd : null,
        activatedAt: accessState.organizationAccessStatus === "active" ? now : null,
        blockedAt: ["blocked", "expired"].includes(accessState.organizationAccessStatus) ? now : null,
        graceEndsAt: null,
      },
    }),
  ]);

  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "TENANT_BILLING_UPDATED",
    entityType: "Organization",
    entityId: input.organizationId,
    details: `Updated billing for organization ${input.organizationId} with ${input.packageMode} package mode and ${input.accountMode} account mode.`,
  });

  revalidatePath("/wq-command-center");
  revalidatePath("/settings/billing");
}

export async function createClientFromCommandCenterAction(
  _prevState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const session = await requirePlatformAdmin();
  const parsed = createClientSchema.safeParse({
    organizationName: formData.get("organizationName"),
    organizationPhone: formData.get("organizationPhone") || undefined,
    ownerName: formData.get("ownerName") || undefined,
    ownerEmail: formData.get("ownerEmail"),
    country: formData.get("country"),
    industry: formData.get("industry"),
    packageId: formData.get("packageId"),
    packageMode: formData.get("packageMode"),
    accountMode: formData.get("accountMode"),
    billingCycle: formData.get("billingCycle"),
    renewalDate: formData.get("renewalDate") || undefined,
    manualPaymentMethod: formData.get("manualPaymentMethod") || undefined,
    manualPaymentReference: formData.get("manualPaymentReference") || undefined,
    adminNotes: formData.get("adminNotes") || undefined,
    customPackageName: formData.get("customPackageName") || undefined,
    customPrice: formData.get("customPrice") ? Number(formData.get("customPrice")) : undefined,
    customUserLimit: formData.get("customUserLimit") ? Number(formData.get("customUserLimit")) : undefined,
    customBranchLimit: formData.get("customBranchLimit") ? Number(formData.get("customBranchLimit")) : undefined,
    customFeatures: formData.get("customFeatures") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid client details.",
    };
  }

  const input = parsed.data;
  const ownerEmail = input.ownerEmail.toLowerCase();

  await ensureDefaultPackages();

  const packageRecord = await prisma.package.findFirst({
    where: { name: PLANS[input.packageId].name, isActive: true },
    select: { id: true, name: true },
  });

  if (!packageRecord) {
    return { success: false, message: "Selected package is not available." };
  }

  const baseSlug = createOrganizationSlug(input.organizationName);
  const slugCount = await prisma.organization.count({
    where: {
      slug: {
        startsWith: baseSlug,
      },
    },
  });
  const organizationSlug = slugCount === 0 ? baseSlug : `${baseSlug}-${slugCount + 1}`;
  const currency = getCurrencyForCountry(input.country);
  const now = new Date();
  const currentPeriodEnd = resolvePeriodEnd(now, input.billingCycle, input.renewalDate);
  const temporaryPassword = randomBytes(6).toString("base64url");
  const ownerName = input.ownerName?.trim() || deriveOwnerName(ownerEmail);
  const customFeatureJson = buildCustomFeatureJson(input.customFeatures);
  const accessState = deriveAccessState({
    accountMode: input.accountMode,
    subscriptionStatus: input.accountMode === "demo" ? "trialing" : "active",
    paymentStatus: input.accountMode === "demo" ? "demo" : "paid",
  });

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: ownerEmail },
      });

      const ownerUser =
        existingUser ??
        (await tx.user.create({
          data: {
            name: ownerName,
            email: ownerEmail,
            password: await bcrypt.hash(`${temporaryPassword}!`, 12),
            authStatus: "verified",
            verifiedAt: now,
            emailVerified: now,
          },
        }));

      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug: organizationSlug,
          email: ownerEmail,
          phone: input.organizationPhone?.trim() || null,
          country: input.country,
          currency,
          industry: input.industry,
          industryType: input.industry,
          enabledModules: INDUSTRY_MODULES[input.industry]?.modules.map((module) => module.id).join(",") ?? null,
          lifecycleStatus: accessState.lifecycleStatus,
          accessStatus: accessState.organizationAccessStatus,
          activatedAt: accessState.organizationAccessStatus === "active" ? now : null,
          isDemoTenant: accessState.isDemoTenant,
          demoExpiresAt: accessState.isDemoTenant ? currentPeriodEnd : null,
          subscription: {
            create: {
              planId: input.packageId,
              status: accessState.subscriptionStatus,
              paymentStatus: accessState.paymentStatus,
              accessStatus: accessState.subscriptionAccessStatus,
              billingCycle: input.billingCycle,
              billingSource: getBillingSource(input.accountMode),
              manualPaymentMethod: input.accountMode === "paid" ? input.manualPaymentMethod ?? null : null,
              manualPaymentReference: input.accountMode === "paid" ? input.manualPaymentReference?.trim() || null : null,
              adminNotes: input.adminNotes?.trim() || null,
              currentPeriodStart: now,
              currentPeriodEnd,
              activatedAt: accessState.organizationAccessStatus === "active" ? now : null,
              packageId: packageRecord.id,
            },
          },
          organizationPackage: {
            create: {
              packageId: packageRecord.id,
              assignedById: session.user.id,
              customUserLimit: input.packageMode === "custom" ? input.customUserLimit : null,
              customBranchLimit: input.packageMode === "custom" ? input.customBranchLimit : null,
              customPackageName: input.packageMode === "custom" ? input.customPackageName?.trim() || null : null,
              customPrice: input.packageMode === "custom" ? input.customPrice ?? null : null,
              customBillingCycle: input.packageMode === "custom" ? input.billingCycle : null,
              customExpiryDate: input.packageMode === "custom" ? currentPeriodEnd : null,
              isCustomPackage: input.packageMode === "custom",
              customFeatureJson: input.packageMode === "custom" ? customFeatureJson : null,
            },
          },
        },
      });

      return {
        organization,
        ownerUser,
        userAlreadyExisted: Boolean(existingUser),
      };
    });

    try {
      await seedPermissions();
      await initializeTenantRoles(transaction.organization.id);
      await initializeTenantBranches(transaction.organization.id);
      await initializeTenantFinances(transaction.organization.id);
    } catch (error) {
      throw new Error(
        `Organization was created, but tenant bootstrap failed: ${error instanceof Error ? error.message : "unknown bootstrap error"}.`,
      );
    }

    const [ownerRole, mainBranch] = await Promise.all([
      prisma.role.findUnique({
        where: {
          name_organizationId: {
            name: "owner",
            organizationId: transaction.organization.id,
          },
        },
      }),
      prisma.branch.findFirst({
        where: {
          organizationId: transaction.organization.id,
          isMain: true,
        },
        select: { id: true },
      }),
    ]);

    if (!ownerRole) {
      return { success: false, message: "Organization was created, but owner role setup failed." };
    }

    await prisma.organizationUser.upsert({
      where: {
        userId_organizationId: {
          userId: transaction.ownerUser.id,
          organizationId: transaction.organization.id,
        },
      },
      update: {
        roleId: ownerRole.id,
        assignedBranchId: mainBranch?.id ?? null,
      },
      create: {
        userId: transaction.ownerUser.id,
        organizationId: transaction.organization.id,
        roleId: ownerRole.id,
        assignedBranchId: mainBranch?.id ?? null,
      },
    });

    await prisma.onboardingState.upsert({
      where: {
        organizationId: transaction.organization.id,
      },
      update: {
        currentStep: 7,
        completedSteps: "welcome,industry,profile,branch,product,customer,invite,complete",
        isCompleted: true,
        completedAt: now,
      },
      create: {
        organizationId: transaction.organization.id,
        currentStep: 7,
        completedSteps: "welcome,industry,profile,branch,product,customer,invite,complete",
        isCompleted: true,
        completedAt: now,
      },
    });

    const effectivePackageName =
      input.packageMode === "custom" ? input.customPackageName?.trim() || packageRecord.name : packageRecord.name;
    const accountModeLabel = input.accountMode === "demo" ? "demo account" : "paid manual account";

    await prisma.auditLog.create({
      data: {
        organizationId: transaction.organization.id,
        userId: transaction.ownerUser.id,
        action: "ADMIN_CLIENT_CREATED",
        entityType: "Organization",
        entityId: transaction.organization.id,
        details: `Client created from command center with ${effectivePackageName} (${accountModeLabel}).`,
      },
    });

    await writePlatformAuditLog({
      actorId: session.user.id,
      action: "CLIENT_CREATED",
      entityType: "Organization",
      entityId: transaction.organization.id,
      details: `Created ${input.organizationName} with ${effectivePackageName} (${input.billingCycle}, ${accountModeLabel}) for ${ownerEmail}.`,
    });

    revalidatePath("/wq-command-center");

    return {
      success: true,
      message: transaction.userAlreadyExisted
        ? `Business created and existing user ${ownerEmail} was attached as owner with immediate ERP access.`
        : `Business created successfully. Temporary password: ${temporaryPassword}!`,
      email: ownerEmail,
      temporaryPassword: transaction.userAlreadyExisted ? undefined : `${temporaryPassword}!`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: formatCreateClientError(error),
    };
  }
}
