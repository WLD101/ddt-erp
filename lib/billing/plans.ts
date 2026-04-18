// lib/billing/plans.ts

export type PlanId = "free" | "pro" | "enterprise";

export interface PlanConfig {
  id: PlanId;
  name: string;
  limits: {
    maxUsers: number;
    maxProducts: number;
    maxMonthlyInvoices: number;
    maxBranches: number;
  };
  features: {
    advancedReports: boolean;
    exportData: boolean;
    auditLogs: boolean;
  };
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free Starter",
    limits: {
      maxUsers: 2,
      maxProducts: 10,
      maxMonthlyInvoices: 50,
      maxBranches: 1,
    },
    features: {
      advancedReports: false,
      exportData: false,
      auditLogs: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro Business",
    limits: {
      maxUsers: 10,
      maxProducts: 500,
      maxMonthlyInvoices: 10000,
      maxBranches: 5,
    },
    features: {
      advancedReports: true,
      exportData: true,
      auditLogs: true,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Global",
    limits: {
      maxUsers: 9999,
      maxProducts: 999999,
      maxMonthlyInvoices: 999999,
      maxBranches: 999,
    },
    features: {
      advancedReports: true,
      exportData: true,
      auditLogs: true,
    },
  },
};

export const DEFAULT_PLAN_ID: PlanId = "free";

export function getPlan(id?: string | null): PlanConfig {
  const planId = (id?.toLowerCase() as PlanId) || DEFAULT_PLAN_ID;
  return PLANS[planId] || PLANS[DEFAULT_PLAN_ID];
}
