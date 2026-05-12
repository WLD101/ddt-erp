import { PLANS, type PlanId } from "@/lib/billing/plans";

export const PACKAGE_PROFILE_STORAGE_KEY = "whatsquery-package-profile";

export type TeamSizeBand = "1-10" | "11-50" | "51-200" | "201+";

export interface PackageProfileInput {
  teamSize?: TeamSizeBand | string | null;
  branchCount?: number | null;
  monthlyInvoices?: number | null;
  needsCommerceSync?: boolean | null;
}

export interface PackageRecommendation {
  planId: PlanId;
  planName: string;
  reason: string;
  summary: string;
}

function normalizeTeamSize(teamSize?: TeamSizeBand | string | null) {
  if (!teamSize) return 0;
  if (teamSize === "1-10") return 10;
  if (teamSize === "11-50") return 50;
  if (teamSize === "51-200") return 200;
  if (teamSize === "201+") return 201;

  const parsed = Number.parseInt(String(teamSize).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function recommendPackage(input: PackageProfileInput): PackageRecommendation {
  const employees = normalizeTeamSize(input.teamSize);
  const branches = Math.max(1, input.branchCount ?? 1);
  const invoices = Math.max(0, input.monthlyInvoices ?? 0);
  const needsCommerceSync = Boolean(input.needsCommerceSync);

  let planId: PlanId = "starter";

  if (employees > 200 || branches > 10 || invoices > 15000) {
    planId = "enterprise";
  } else if (employees > 50 || branches > 3 || invoices > 2500 || needsCommerceSync) {
    planId = "pro";
  } else if (employees > 10 || branches > 1 || invoices > 300) {
    planId = "business";
  }

  const plan = PLANS[planId];

  const reasons: string[] = [];
  if (employees) reasons.push(`${employees >= 201 ? "201+" : employees} team capacity`);
  if (branches > 1) reasons.push(`${branches} branches`);
  if (invoices > 0) reasons.push(`${invoices.toLocaleString()} invoices/month`);
  if (needsCommerceSync) reasons.push("commerce sync");

  const reason = reasons.length
    ? `Best fit for ${reasons.join(", ")}.`
    : `Best fit for ${plan.audience.toLowerCase()}.`;

  const summary =
    planId === "enterprise"
      ? "Start with Enterprise if you need custom workflows, multi-company setup, or higher limits."
      : `${plan.name} covers ${plan.limits.maxUsers.toLocaleString()} users and ${plan.limits.maxBranches.toLocaleString()} branches.`;

  return {
    planId,
    planName: plan.name,
    reason,
    summary,
  };
}
