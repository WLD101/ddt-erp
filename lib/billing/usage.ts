// lib/billing/usage.ts

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export interface TenantUsage {
  users: number;
  products: number;
  monthlyInvoices: number;
  monthlySalesEntries: number;
  monthlyPurchases: number;
  branches: number;
  integrations: number;
  customers: number;
  suppliers: number;
  exportsToday: number;
  assistantActionsThisMonth: number;
  storageGb: number | null;
  apiRequestsThisMonth: number | null;
}

/**
 * Calculates real-time usage for a specific organization.
 * 
 * @param orgId The organization to check
 * @param periodStart Optional start of the billing period
 * @param periodEnd Optional end of the billing period
 */
export async function getTenantUsage(
  orgId: string, 
  periodStart?: Date, 
  periodEnd?: Date
): Promise<TenantUsage> {
  // Fallback to calendar month if no subscription dates provided
  const start = periodStart || startOfMonth(new Date());
  const end = periodEnd || endOfMonth(new Date());

  const exportDayStart = new Date();
  exportDayStart.setHours(0, 0, 0, 0);

  const [
    userCount,
    productCount,
    monthInvoiceCount,
    monthPurchaseCount,
    branchCount,
    integrationCount,
    customerCount,
    supplierCount,
    exportCountToday,
    assistantActionsThisMonth,
  ] = await Promise.all([
    // Active team members
    prisma.organizationUser.count({ 
      where: { organizationId: orgId } 
    }),
    
    // Product catalog size
    prisma.product.count({ 
      where: { organizationId: orgId } 
    }),
    
    // Sales generated within the current billing cycle
    prisma.salesInvoice.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.purchaseInvoice.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.branch.count({
      where: {
        organizationId: orgId,
      },
    }),
    prisma.salesChannel.count({
      where: {
        organizationId: orgId,
        isActive: true,
      },
    }),
    prisma.customer.count({
      where: {
        organizationId: orgId,
      },
    }),
    prisma.supplier.count({
      where: {
        organizationId: orgId,
      },
    }),
    prisma.exportRequest.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: exportDayStart },
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        organizationId: orgId,
        timestamp: { gte: start, lte: end },
        name: {
          in: [
            "ASSISTANT_COMMAND_EXECUTED",
            "ASSISTANT_CREATE_CUSTOMER",
            "ASSISTANT_CREATE_INVOICE",
            "ASSISTANT_QUERY_EXECUTED",
          ],
        },
      },
    }),
  ]);

  return {
    users: userCount,
    products: productCount,
    monthlyInvoices: monthInvoiceCount,
    monthlySalesEntries: monthInvoiceCount,
    monthlyPurchases: monthPurchaseCount,
    branches: branchCount,
    integrations: integrationCount,
    customers: customerCount,
    suppliers: supplierCount,
    exportsToday: exportCountToday,
    assistantActionsThisMonth,
    storageGb: null,
    apiRequestsThisMonth: null,
  };
}
