"use server";

import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import * as service from "./service";

import { canUseFeature } from "@/lib/billing/enforcement";

/**
 * DASHBOARD KPI METRICS
 */
export async function getDashboardMetrics(fromDate?: string, toDate?: string) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "reports.view");
  const db = getTenantStore(ctx);
  return service.getDashboardMetrics(db, ctx.branchId, fromDate, toDate);
}

/**
 * FINANCIAL TRENDS (Revenue vs Expenses)
 */
export async function getFinancialTrends(
  days = 30, 
  fromDate?: string, 
  toDate?: string, 
  interval: "day" | "week" | "month" = "day"
) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "reports.view");
  const db = getTenantStore(ctx);
  
  // FEATURE GATE (Plan Enforcement)
  const allowed = await canUseFeature(ctx.organizationId, "advancedReports");
  if (!allowed) {
    throw new Error("Financial trends are only available on Pro and Enterprise plans.");
  }

  return service.getFinancialTrends(db, ctx.branchId, days, fromDate, toDate, interval);
}

/**
 * RECENT ACTIVITY FEED
 */
export async function getRecentTransactions(limit = 10) {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getRecentTransactions(db, limit);
}
