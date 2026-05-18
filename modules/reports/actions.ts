"use server";

import {
  getCurrentTenantContext,
  requirePermission,
  TenantForbiddenError,
} from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import * as service from "./service";

import { canUseFeature } from "@/lib/billing/enforcement";
import { AnalyticCategory, trackEvent } from "@/modules/analytics/service";

type ReportInterval = "day" | "week" | "month";

type ReportsWorkspaceInput = {
  fromDate?: string;
  toDate?: string;
  interval?: string;
};

type ReportsWorkspacePayload = {
  metrics: Awaited<ReturnType<typeof service.getDashboardMetrics>>;
  trends: Awaited<ReturnType<typeof service.getFinancialTrends>>;
  transactions: Awaited<ReturnType<typeof service.getRecentTransactions>>;
  canViewAdvancedTrends: boolean;
  trendNotice: string | null;
};

type ReportsWorkspaceResult =
  | { success: true; data: ReportsWorkspacePayload }
  | { success: false; message: string };

function normalizeDateInput(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
}

function normalizeInterval(value?: string): ReportInterval {
  if (value === "week" || value === "month") {
    return value;
  }

  return "day";
}

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
    return [];
  }

  return service.getFinancialTrends(db, ctx.branchId, days, fromDate, toDate, interval);
}

/**
 * RECENT ACTIVITY FEED
 */
export async function getRecentTransactions(limit = 10) {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getRecentTransactions(db, ctx.branchId, limit);
}

/**
 * DASHBOARD: TOP PRODUCTS
 */
export async function getTopProducts(limit = 5) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "reports.view");
  const db = getTenantStore(ctx);
  return service.getTopProducts(db, ctx.branchId, limit);
}

/**
 * DASHBOARD: LOW STOCK ALERTS
 * Maps to inventory service logic for convenience.
 */
export async function getLowStockAlerts() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "products.view");
  const db = getTenantStore(ctx);
  return service.getLowStockAlerts(db);
}

/**
 * DASHBOARD: CHART DATA
 */
export async function getChartData() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "reports.view");
  const db = getTenantStore(ctx);
  const allowed = await canUseFeature(ctx.organizationId, "advancedReports");
  if (!allowed) {
    return [];
  }
  return service.getFinancialTrends(db, ctx.branchId, 30);
}

/**
 * DASHBOARD: ECOMMERCE INTELLIGENCE
 */
export async function getEcommerceIntelligence() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "reports.view");
  const db = getTenantStore(ctx);
  return service.getEcommerceIntelligence(db, ctx.branchId);
}

export async function getBusinessHealthScore() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "reports.view");
  const db = getTenantStore(ctx);
  return service.getBusinessHealthScore(db, ctx.branchId);
}

export async function getTodaysBusinessSummary() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "reports.view");
  const db = getTenantStore(ctx);
  return service.getTodaysBusinessSummary(db, ctx.branchId);
}

export async function getEcommerceSyncSummary() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "reports.view");
  const db = getTenantStore(ctx);
  return service.getEcommerceSyncSummary(db);
}

/**
 * DASHBOARD: OUTSTANDING BALANCES
 */
export async function getOutstandingBalances() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "reports.view");
  const db = getTenantStore(ctx);
  return service.getOutstandingBalances(db);
}

export async function loadReportsWorkspaceAction(
  input: ReportsWorkspaceInput = {}
): Promise<ReportsWorkspaceResult> {
  try {
    const ctx = await getCurrentTenantContext();
    requirePermission(ctx, "reports.view");

    const db = getTenantStore(ctx);
    const fromDate = normalizeDateInput(input.fromDate);
    const toDate = normalizeDateInput(input.toDate);
    const interval = normalizeInterval(input.interval);
    const canViewAdvancedTrends = await canUseFeature(
      ctx.organizationId,
      "advancedReports"
    );

    const [metrics, transactions, trends] = await Promise.all([
      service.getDashboardMetrics(db, ctx.branchId, fromDate, toDate),
      service.getRecentTransactions(db, ctx.branchId, 10),
      canViewAdvancedTrends
        ? service.getFinancialTrends(
            db,
            ctx.branchId,
            30,
            fromDate,
            toDate,
            interval
          )
        : Promise.resolve([]),
    ]);

    void trackEvent({
      name: "REPORT_WORKSPACE_LOADED",
      category: AnalyticCategory.BILLING,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      properties: {
        branchId: ctx.branchId,
        fromDate: fromDate || null,
        toDate: toDate || null,
        interval,
        advanced: canViewAdvancedTrends,
      },
    });

    return {
      success: true,
      data: {
        metrics,
        transactions,
        trends,
        canViewAdvancedTrends,
        trendNotice: canViewAdvancedTrends
          ? null
          : "Financial trends are available on Pro and Enterprise plans.",
      },
    };
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return {
        success: false,
        message:
          "You do not have permission to view reports for this workspace.",
      };
    }

    console.error("[reports-workspace] failed to load", error);
    return {
      success: false,
      message:
        "We couldn't load reports right now. Please try again in a moment.",
    };
  }
}
