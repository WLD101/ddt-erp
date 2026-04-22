// lib/billing/enforcement.ts

import { prisma } from "@/lib/prisma";
import { getPlan, PlanConfig } from "./plans";
import { getTenantUsage } from "./usage";
import { getOrganizationAccessState } from "./access";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export async function getSubscriptionContext(orgId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
  });

  const plan = getPlan(sub?.planId);
  
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

  return { sub, plan, usage, status, daysRemaining };
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
  const current = usage[limitType as keyof typeof usage] || 0;

  if (current >= limit) {
    throw new PlanLimitError(
      `Plan Limit Reached: Your ${plan.name} plan allows up to ${limit} ${limitType}. You are currently at ${current}.`
    );
  }
}
