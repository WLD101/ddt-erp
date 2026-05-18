// lib/billing/enforcement.ts

import { prisma } from "@/lib/prisma";
import { getPlan, PlanConfig, getPlanPriceForCycle, normalizePlanId } from "./plans";
import { getTenantUsage } from "./usage";
import { getOrganizationAccessState } from "./access";
import { inferPlanIdFromPackage } from "./catalog";

function readJsonObject(value?: string | null) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function readNumberMeta(meta: Record<string, unknown>, key: string, fallback: number | null) {
  return typeof meta[key] === "number" ? (meta[key] as number) : fallback;
}

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export async function getSubscriptionContext(orgId: string) {
  const [sub, assignment] = await Promise.all([
    prisma.subscription.findUnique({
      where: { organizationId: orgId },
      include: { Package: true },
    }),
    prisma.organizationPackage.findUnique({
      where: { organizationId: orgId },
      include: { package: true },
    }),
  ]);

  const packageRecord = assignment?.package ?? sub?.Package ?? null;
  const effectivePlanId =
    normalizePlanId(sub?.planId) ||
    inferPlanIdFromPackage(packageRecord, sub?.planId) ||
    "starter";
  const basePlan = getPlan(effectivePlanId);
  const packageMeta = readJsonObject(packageRecord?.featureJson);
  const customMeta = readJsonObject(assignment?.customFeatureJson);
  const billingCycle = sub?.billingCycle || assignment?.customBillingCycle || "MONTHLY";
  const monthlyPrice =
    assignment?.customPrice ??
    (typeof packageMeta.monthlyPrice === "number" ? packageMeta.monthlyPrice : basePlan.price.monthly);
  const yearlyPrice =
    typeof packageMeta.yearlyPrice === "number"
      ? packageMeta.yearlyPrice
      : getPlanPriceForCycle(basePlan.id, "YEARLY");
  const displayPriceValue = billingCycle === "YEARLY" ? assignment?.customPrice ?? yearlyPrice : monthlyPrice;
  const branchLimit =
    assignment?.customBranchLimit ??
    (typeof packageMeta.branchLimit === "number" ? packageMeta.branchLimit : basePlan.limits.maxBranches);
  const customFeatures =
    customMeta.features && typeof customMeta.features === "object"
      ? (customMeta.features as Partial<PlanConfig["features"]>)
      : {};
  const featureList = Array.isArray(customMeta.featureList)
    ? customMeta.featureList.filter((item): item is string => typeof item === "string")
    : Array.isArray(packageMeta.modules)
      ? packageMeta.modules.filter((item): item is string => typeof item === "string")
      : basePlan.includedModules;
  const effectiveLimits: PlanConfig["limits"] = {
    ...basePlan.limits,
    maxUsers: assignment?.customUserLimit ?? basePlan.limits.maxUsers,
    maxBranches: branchLimit,
    maxProducts: readNumberMeta(packageMeta, "productLimit", basePlan.limits.maxProducts) ?? basePlan.limits.maxProducts,
    maxMonthlyInvoices:
      readNumberMeta(packageMeta, "monthlyInvoiceLimit", basePlan.limits.maxMonthlyInvoices) ?? basePlan.limits.maxMonthlyInvoices,
    maxIntegrations:
      readNumberMeta(packageMeta, "integrationsLimit", basePlan.limits.maxIntegrations) ?? basePlan.limits.maxIntegrations,
    maxCustomers: readNumberMeta(packageMeta, "customerLimit", basePlan.limits.maxCustomers) ?? basePlan.limits.maxCustomers,
    maxSuppliers: readNumberMeta(packageMeta, "supplierLimit", basePlan.limits.maxSuppliers) ?? basePlan.limits.maxSuppliers,
    maxMonthlyPurchases:
      readNumberMeta(packageMeta, "monthlyPurchaseLimit", basePlan.limits.maxMonthlyPurchases) ?? basePlan.limits.maxMonthlyPurchases,
    maxMonthlySalesEntries:
      readNumberMeta(packageMeta, "monthlySalesEntryLimit", basePlan.limits.maxMonthlySalesEntries) ?? basePlan.limits.maxMonthlySalesEntries,
    maxDailyExports:
      readNumberMeta(packageMeta, "dailyExportLimit", basePlan.limits.maxDailyExports) ?? basePlan.limits.maxDailyExports,
    maxMonthlyAssistantActions:
      readNumberMeta(packageMeta, "monthlyAssistantActionLimit", basePlan.limits.maxMonthlyAssistantActions)
      ?? basePlan.limits.maxMonthlyAssistantActions,
    maxStorageGb: readNumberMeta(packageMeta, "storageGbLimit", basePlan.limits.maxStorageGb),
    maxApiRequestsMonthly: readNumberMeta(packageMeta, "monthlyApiRequestLimit", basePlan.limits.maxApiRequestsMonthly),
  };
  const effectivePlan: PlanConfig = {
    ...basePlan,
    name: assignment?.customPackageName ?? packageRecord?.name ?? basePlan.name,
    price: {
      ...basePlan.price,
      monthly: monthlyPrice,
      yearly: assignment?.customPrice ?? yearlyPrice,
      display:
        monthlyPrice === null
          ? "Custom"
          : `${displayPriceValue?.toLocaleString() ?? ""}`,
      cadence: billingCycle === "YEARLY" ? "/year" : basePlan.price.cadence,
      annualEquivalent:
        readNumberMeta(packageMeta, "annualEquivalent", basePlan.price.annualEquivalent) ?? basePlan.price.annualEquivalent,
      savingsPercent:
        readNumberMeta(packageMeta, "annualSavingsPercent", basePlan.price.savingsPercent) ?? basePlan.price.savingsPercent,
      promoLabel:
        typeof packageMeta.annualPromoLabel === "string" ? packageMeta.annualPromoLabel : basePlan.price.promoLabel,
      promoEnabled:
        typeof packageMeta.annualPromoEnabled === "boolean" ? packageMeta.annualPromoEnabled : basePlan.price.promoEnabled,
      discountCountdownReady:
        typeof packageMeta.discountCountdownReady === "boolean"
          ? packageMeta.discountCountdownReady
          : basePlan.price.discountCountdownReady,
    },
    limits: effectiveLimits,
    features: {
      ...basePlan.features,
      ...customFeatures,
    },
    includedModules: featureList,
  };
  
  const access = await getOrganizationAccessState(orgId);
  let status = access.status === "grace_period" ? "grace_period" : sub?.status || access.status || "active";
  let daysRemaining = 0;

  if (sub?.currentPeriodEnd) {
    const msRemaining = sub.currentPeriodEnd.getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  }

  // Trial expiry detection
  if (status === "trialing" && daysRemaining <= 0) {
    status = "expired";
  }

  // Active usage
  const usage = await getTenantUsage(
    orgId, 
    sub?.currentPeriodStart || undefined, 
    sub?.currentPeriodEnd || undefined
  );

  return {
    sub,
    assignment,
    plan: effectivePlan,
    usage,
    status,
    daysRemaining,
    packageName: effectivePlan.name,
    billingCycle,
    billingSource: sub?.billingSource || (sub?.paymentStatus === "demo" ? "demo" : "manual"),
    paymentStatus: sub?.paymentStatus || "payment_pending",
    renewalDate: assignment?.customExpiryDate ?? sub?.currentPeriodEnd ?? null,
    manualPaymentMethod: sub?.manualPaymentMethod ?? null,
    manualPaymentReference: sub?.manualPaymentReference ?? null,
    adminNotes: sub?.adminNotes ?? null,
    stripeCustomerId: sub?.stripeCustomerId ?? null,
    stripeSubscriptionId: sub?.stripeSubscriptionId ?? null,
    stripePriceId: sub?.stripePriceId ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    isCustomPackage: assignment?.isCustomPackage ?? false,
    featureList,
  };
}

/**
 * GATES FEATURE ACCESS
 * Returns false if feature is not supported by current plan.
 */
export async function canUseFeature(orgId: string, feature: keyof PlanConfig["features"]): Promise<boolean> {
  const { plan, status } = await getSubscriptionContext(orgId);
  
  if (!["active", "trialing", "grace_period"].includes(status)) return false;
  
  return plan.features[feature] === true;
}

/**
 * ENFORCES PLAN LIMITS
 * Throws a PlanLimitError if the current consumption meets or exceeds the plan cap.
 */
export async function assertPlanLimit(orgId: string, limitType: keyof PlanConfig["limits"]) {
  const { plan, usage, status } = await getSubscriptionContext(orgId);

  if (!["active", "trialing", "grace_period"].includes(status)) {
    throw new PlanLimitError("Your subscription has expired. Please upgrade to a paid plan to continue.");
  }

  const limit = plan.limits[limitType];
  const usageByLimitKey: Record<keyof PlanConfig["limits"], number | null> = {
    maxUsers: usage.users,
    maxProducts: usage.products,
    maxMonthlyInvoices: usage.monthlyInvoices,
    maxBranches: usage.branches,
    maxIntegrations: usage.integrations,
    maxCustomers: usage.customers,
    maxSuppliers: usage.suppliers,
    maxMonthlyPurchases: usage.monthlyPurchases,
    maxMonthlySalesEntries: usage.monthlySalesEntries,
    maxDailyExports: usage.exportsToday,
    maxMonthlyAssistantActions: usage.assistantActionsThisMonth,
    maxStorageGb: usage.storageGb,
    maxApiRequestsMonthly: usage.apiRequestsThisMonth,
  };
  const current = usageByLimitKey[limitType];

  if (limit === null || current === null) {
    return;
  }

  if (current >= limit) {
    throw new PlanLimitError(
      `Plan Limit Reached: Your ${plan.name} plan allows up to ${limit} ${limitType}. You are currently at ${current}.`
    );
  }
}
