"use server";

import { getCurrentTenantContext, requirePermission } from "@/lib/tenant";
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
