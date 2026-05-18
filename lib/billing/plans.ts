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
  };
  highlight?: boolean;
  limits: {
    maxUsers: number;
    maxProducts: number;
    maxMonthlyInvoices: number;
    maxBranches: number;
    maxIntegrations: number;
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
      yearly: 30000,
      currency: "PKR",
      display: "Rs. 3,000",
      cadence: "/month",
    },
    limits: {
      maxUsers: 2,
      maxProducts: 200,
      maxMonthlyInvoices: 300,
      maxBranches: 1,
      maxIntegrations: 1,
    },
    features: {
      advancedReports: false,
      exportData: false,
      auditLogs: false,
      basicReports: true,
      purchases: false,
      expenses: false,
      csvImport: false,
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
    ],
    supportLabel: "Email support",
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "For growing SMEs managing multiple locations.",
    audience: "Retail, distribution, and wholesale teams",
    price: {
      monthly: 7000,
      yearly: 70000,
      currency: "PKR",
      display: "Rs. 7,000",
      cadence: "/month",
    },
    highlight: true,
    limits: {
      maxUsers: 8,
      maxProducts: 1500,
      maxMonthlyInvoices: 2500,
      maxBranches: 3,
      maxIntegrations: 2,
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
      "Reports",
      "WooCommerce / Shopify",
      "CSV import",
    ],
    supportLabel: "Business-hours support",
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For serious ecommerce and multi-branch operators.",
    audience: "Omnichannel sellers and established wholesalers",
    price: {
      monthly: 15000,
      yearly: 150000,
      currency: "PKR",
      display: "Rs. 15,000",
      cadence: "/month",
    },
    limits: {
      maxUsers: 25,
      maxProducts: 10000,
      maxMonthlyInvoices: 15000,
      maxBranches: 5,
      maxIntegrations: 8,
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
      apiAccess: false,
      customWorkflows: false,
      dedicatedOnboarding: false,
    },
    includedModules: [
      "Daraz integration",
      "Advanced reports",
      "Ecommerce sync",
      "Audit logs",
      "Priority support",
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
    },
    limits: {
      maxUsers: 9999,
      maxProducts: 999999,
      maxMonthlyInvoices: 999999,
      maxBranches: 999,
      maxIntegrations: 999,
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
      "Unlimited branches and users",
      "Custom workflows",
      "API access",
      "Dedicated onboarding",
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
  return limit > 9000 ? "Unlimited" : limit.toLocaleString();
}

export function getPlanPriceForCycle(planId: PlanId, billingCycle: BillingCycle) {
  const plan = PLANS[planId];
  return billingCycle === "YEARLY" ? plan.price.yearly : plan.price.monthly;
}
