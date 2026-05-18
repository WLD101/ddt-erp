// lib/billing/plans.ts

export type PlanId = "starter" | "business" | "pro" | "enterprise";
type PlanLookupId = PlanId | "free" | "demo";
export type BillingCycle = "MONTHLY" | "YEARLY" | "CUSTOM";

export interface PlanConfig {
  id: PlanId;
  name: string;
  tagline: string;
  audience: string;
  price: {
    monthly: number | null;
    yearly: number | null;
    currency: "PKR";
    display: string;
    cadence: string;
    annualEquivalent: number | null;
    savingsPercent: number | null;
    promoLabel: string | null;
    promoEnabled: boolean;
    discountCountdownReady: boolean;
  };
  highlight?: boolean;
  dedicatedInfraRequired?: boolean;
  limits: {
    maxUsers: number;
    maxProducts: number;
    maxMonthlyInvoices: number;
    maxBranches: number;
    maxIntegrations: number;
    maxCustomers: number;
    maxSuppliers: number;
    maxMonthlyPurchases: number;
    maxMonthlySalesEntries: number;
    maxDailyExports: number;
    maxMonthlyAssistantActions: number;
    maxStorageGb: number | null;
    maxApiRequestsMonthly: number | null;
  };
  features: {
    advancedReports: boolean;
    exportData: boolean;
    auditLogs: boolean;
    basicReports: boolean;
    purchases: boolean;
    expenses: boolean;
    csvImport: boolean;
    shopifyIntegration: boolean;
    woocommerceIntegration: boolean;
    darazIntegration: boolean;
    ecommerceSync: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    customWorkflows: boolean;
    dedicatedOnboarding: boolean;
  };
  includedModules: string[];
  supportLabel: string;
}

export const PLAN_ORDER: PlanId[] = ["starter", "business", "pro", "enterprise"];

export const PLANS: Record<PlanId, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "For single-branch retailers getting organized.",
    audience: "Small shop or early-stage wholesale desk",
    price: {
      monthly: 3000,
      yearly: 24000,
      currency: "PKR",
      display: "Rs. 3,000",
      cadence: "/month",
      annualEquivalent: 36000,
      savingsPercent: 33,
      promoLabel: "Limited Time Offer - Pay annually and get 4 months FREE",
      promoEnabled: true,
      discountCountdownReady: true,
    },
    limits: {
      maxUsers: 2,
      maxProducts: 500,
      maxMonthlyInvoices: 300,
      maxBranches: 1,
      maxIntegrations: 1,
      maxCustomers: 500,
      maxSuppliers: 250,
      maxMonthlyPurchases: 150,
      maxMonthlySalesEntries: 300,
      maxDailyExports: 5,
      maxMonthlyAssistantActions: 100,
      maxStorageGb: 1,
      maxApiRequestsMonthly: null,
    },
    features: {
      advancedReports: false,
      exportData: false,
      auditLogs: false,
      basicReports: true,
      purchases: false,
      expenses: false,
      csvImport: true,
      // Import/export remains available through lightweight CSV/XLSX flows.
      shopifyIntegration: false,
      woocommerceIntegration: false,
      darazIntegration: false,
      ecommerceSync: false,
      prioritySupport: false,
      apiAccess: false,
      customWorkflows: false,
      dedicatedOnboarding: false,
    },
    includedModules: [
      "Customers",
      "Suppliers",
      "Products",
      "Inventory",
      "Sales invoices",
      "Basic reports",
      "CSV/XLSX import",
    ],
    supportLabel: "Standard support",
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "For growing SMEs managing multiple locations.",
    audience: "Retail, distribution, and wholesale teams",
    price: {
      monthly: 7000,
      yearly: 56000,
      currency: "PKR",
      display: "Rs. 7,000",
      cadence: "/month",
      annualEquivalent: 84000,
      savingsPercent: 33,
      promoLabel: "Limited Time Offer - Pay annually and get 4 months FREE",
      promoEnabled: true,
      discountCountdownReady: true,
    },
    highlight: true,
    limits: {
      maxUsers: 8,
      maxProducts: 2500,
      maxMonthlyInvoices: 1500,
      maxBranches: 3,
      maxIntegrations: 2,
      maxCustomers: 3000,
      maxSuppliers: 1500,
      maxMonthlyPurchases: 800,
      maxMonthlySalesEntries: 1500,
      maxDailyExports: 25,
      maxMonthlyAssistantActions: 1000,
      maxStorageGb: 5,
      maxApiRequestsMonthly: null,
    },
    features: {
      advancedReports: false,
      exportData: true,
      auditLogs: false,
      basicReports: true,
      purchases: true,
      expenses: true,
      csvImport: true,
      shopifyIntegration: true,
      woocommerceIntegration: true,
      darazIntegration: false,
      ecommerceSync: false,
      prioritySupport: false,
      apiAccess: false,
      customWorkflows: false,
      dedicatedOnboarding: false,
    },
    includedModules: [
      "Sales",
      "Purchases",
      "Expenses",
      "Inventory",
      "Standard reports",
      "WooCommerce / Shopify",
      "CSV/XLSX import/export",
    ],
    supportLabel: "Priority support",
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For serious ecommerce and multi-branch operators.",
    audience: "Omnichannel sellers and established wholesalers",
    price: {
      monthly: 15000,
      yearly: 120000,
      currency: "PKR",
      display: "Rs. 15,000",
      cadence: "/month",
      annualEquivalent: 180000,
      savingsPercent: 33,
      promoLabel: "Limited Time Offer - Pay annually and get 4 months FREE",
      promoEnabled: true,
      discountCountdownReady: true,
    },
    limits: {
      maxUsers: 25,
      maxProducts: 10000,
      maxMonthlyInvoices: 5000,
      maxBranches: 5,
      maxIntegrations: 8,
      maxCustomers: 10000,
      maxSuppliers: 5000,
      maxMonthlyPurchases: 2500,
      maxMonthlySalesEntries: 5000,
      maxDailyExports: 100,
      maxMonthlyAssistantActions: 5000,
      maxStorageGb: 20,
      maxApiRequestsMonthly: 50000,
    },
    features: {
      advancedReports: true,
      exportData: true,
      auditLogs: true,
      basicReports: true,
      purchases: true,
      expenses: true,
      csvImport: true,
      shopifyIntegration: true,
      woocommerceIntegration: true,
      darazIntegration: true,
      ecommerceSync: true,
      prioritySupport: true,
      apiAccess: true,
      customWorkflows: false,
      dedicatedOnboarding: false,
    },
    includedModules: [
      "Daraz integration",
      "Advanced reports",
      "Ecommerce sync",
      "Audit logs",
      "Priority support",
      "API access (rate limited)",
    ],
    supportLabel: "Priority support",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For large groups that need tailored workflows.",
    audience: "Multi-company, custom-process organizations",
    price: {
      monthly: null,
      yearly: null,
      currency: "PKR",
      display: "Custom",
      cadence: "",
      annualEquivalent: null,
      savingsPercent: null,
      promoLabel: "Dedicated resources available",
      promoEnabled: false,
      discountCountdownReady: false,
    },
    dedicatedInfraRequired: true,
    limits: {
      maxUsers: 9999,
      maxProducts: 999999,
      maxMonthlyInvoices: 999999,
      maxBranches: 999,
      maxIntegrations: 999,
      maxCustomers: 999999,
      maxSuppliers: 999999,
      maxMonthlyPurchases: 999999,
      maxMonthlySalesEntries: 999999,
      maxDailyExports: 999999,
      maxMonthlyAssistantActions: 999999,
      maxStorageGb: null,
      maxApiRequestsMonthly: null,
    },
    features: {
      advancedReports: true,
      exportData: true,
      auditLogs: true,
      basicReports: true,
      purchases: true,
      expenses: true,
      csvImport: true,
      shopifyIntegration: true,
      woocommerceIntegration: true,
      darazIntegration: true,
      ecommerceSync: true,
      prioritySupport: true,
      apiAccess: true,
      customWorkflows: true,
      dedicatedOnboarding: true,
    },
    includedModules: [
      "Dedicated resources available",
      "Custom workflows",
      "API access",
      "Dedicated onboarding",
      "Dedicated DB / backups on review",
    ],
    supportLabel: "Dedicated success manager",
  },
};

export const DEFAULT_PLAN_ID: PlanId = "starter";

const PLAN_ALIASES: Record<string, PlanLookupId> = {
  free: "starter",
  demo: "pro",
  starter: "starter",
  business: "business",
  pro: "pro",
  enterprise: "enterprise",
};

export function getPlan(id?: string | null): PlanConfig {
  const normalized = PLAN_ALIASES[(id || DEFAULT_PLAN_ID).toLowerCase()] || DEFAULT_PLAN_ID;
  return PLANS[normalized as PlanId] || PLANS[DEFAULT_PLAN_ID];
}

export function normalizePlanId(id?: string | null): PlanId | null {
  if (!id) return null;
  const normalized = PLAN_ALIASES[id.toLowerCase()];
  return normalized && normalized !== "free" && normalized !== "demo" ? (normalized as PlanId) : null;
}

export function formatPlanLimit(limit: number) {
  return limit > 9000 ? "Custom" : limit.toLocaleString();
}

export function getPlanPriceForCycle(planId: PlanId, billingCycle: BillingCycle) {
  const plan = PLANS[planId];
  return billingCycle === "YEARLY" ? plan.price.yearly : plan.price.monthly;
}
