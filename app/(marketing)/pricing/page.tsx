import { PLAN_ORDER, PLANS } from "@/lib/billing/plans";
import { inferPlanIdFromPackage } from "@/lib/billing/catalog";
import { getActivePackages } from "@/modules/packages/actions";

import { PricingPlansClient, type PricingPlanCard } from "./PricingPlansClient";

export const dynamic = "force-dynamic";

type PricingPackage = {
  id: string;
  name: string;
  businessSize: string | null;
  userLimit: number;
  featureJson: string;
  isCustom: boolean;
};

function parsePackageMeta(featureJson: string) {
  try {
    return JSON.parse(featureJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function buildFallbackPackages(): PricingPackage[] {
  return PLAN_ORDER.map((planId) => {
    const plan = PLANS[planId];
    return {
      id: `fallback-${plan.id}`,
      name: plan.name,
      businessSize: plan.audience,
      userLimit: plan.limits.maxUsers,
      featureJson: JSON.stringify({
        planId: plan.id,
        monthlyPrice: plan.price.monthly,
        yearlyPrice: plan.price.yearly,
        annualEquivalent: plan.price.annualEquivalent,
        annualSavingsPercent: plan.price.savingsPercent,
        annualPromoLabel: plan.price.promoLabel,
        annualPromoEnabled: plan.price.promoEnabled,
        branchLimit: plan.limits.maxBranches,
        productLimit: plan.limits.maxProducts,
        customerLimit: plan.limits.maxCustomers,
        supplierLimit: plan.limits.maxSuppliers,
        monthlyInvoiceLimit: plan.limits.maxMonthlyInvoices,
        monthlyPurchaseLimit: plan.limits.maxMonthlyPurchases,
        dailyExportLimit: plan.limits.maxDailyExports,
        monthlyAssistantActionLimit: plan.limits.maxMonthlyAssistantActions,
        modules: plan.includedModules,
        supportLabel: plan.supportLabel,
        tagline: plan.tagline,
        dedicatedInfraRequired: plan.dedicatedInfraRequired ?? false,
      }),
      isCustom: plan.id === "enterprise",
    };
  });
}

function toPricingCard(pkg: PricingPackage): PricingPlanCard {
  const planId = inferPlanIdFromPackage(pkg);
  const plan = PLANS[planId];
  const meta = parsePackageMeta(pkg.featureJson);

  return {
    id: pkg.id,
    planId,
    name: pkg.name,
    tagline: typeof meta.tagline === "string" ? meta.tagline : plan.tagline,
    audience: pkg.businessSize || plan.audience,
    highlight: Boolean(plan.highlight),
    isEnterprise: planId === "enterprise",
    dedicatedInfraRequired:
      typeof meta.dedicatedInfraRequired === "boolean" ? meta.dedicatedInfraRequired : Boolean(plan.dedicatedInfraRequired),
    monthlyPrice: typeof meta.monthlyPrice === "number" ? meta.monthlyPrice : plan.price.monthly,
    yearlyPrice: typeof meta.yearlyPrice === "number" ? meta.yearlyPrice : plan.price.yearly,
    annualEquivalent: typeof meta.annualEquivalent === "number" ? meta.annualEquivalent : plan.price.annualEquivalent,
    savingsPercent:
      typeof meta.annualSavingsPercent === "number" ? meta.annualSavingsPercent : plan.price.savingsPercent,
    promoEnabled:
      typeof meta.annualPromoEnabled === "boolean" ? meta.annualPromoEnabled : plan.price.promoEnabled,
    promoLabel: typeof meta.annualPromoLabel === "string" ? meta.annualPromoLabel : plan.price.promoLabel,
    branches: typeof meta.branchLimit === "number" ? meta.branchLimit : plan.limits.maxBranches,
    users: pkg.userLimit || plan.limits.maxUsers,
    products: typeof meta.productLimit === "number" ? meta.productLimit : plan.limits.maxProducts,
    customers: typeof meta.customerLimit === "number" ? meta.customerLimit : plan.limits.maxCustomers,
    suppliers: typeof meta.supplierLimit === "number" ? meta.supplierLimit : plan.limits.maxSuppliers,
    monthlyInvoices:
      typeof meta.monthlyInvoiceLimit === "number" ? meta.monthlyInvoiceLimit : plan.limits.maxMonthlyInvoices,
    monthlyPurchases:
      typeof meta.monthlyPurchaseLimit === "number" ? meta.monthlyPurchaseLimit : plan.limits.maxMonthlyPurchases,
    dailyExports: typeof meta.dailyExportLimit === "number" ? meta.dailyExportLimit : plan.limits.maxDailyExports,
    monthlyAssistantActions:
      typeof meta.monthlyAssistantActionLimit === "number"
        ? meta.monthlyAssistantActionLimit
        : plan.limits.maxMonthlyAssistantActions,
    supportLabel: typeof meta.supportLabel === "string" ? meta.supportLabel : plan.supportLabel,
    modules: Array.isArray(meta.modules) ? meta.modules.filter((item): item is string => typeof item === "string") : plan.includedModules,
  };
}

export default async function PricingPage() {
  let dbPackages: PricingPackage[] = buildFallbackPackages();

  try {
    dbPackages = await getActivePackages();
  } catch (error) {
    console.error("[pricing-page] falling back to static package catalog", error);
  }

  const plans = dbPackages
    .filter((pkg) => !pkg.isCustom || pkg.name.toLowerCase() === "enterprise")
    .sort((a, b) => PLAN_ORDER.indexOf(inferPlanIdFromPackage(a)) - PLAN_ORDER.indexOf(inferPlanIdFromPackage(b)))
    .map(toPricingCard);

  return <PricingPlansClient plans={plans} />;
}
