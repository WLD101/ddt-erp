// lib/billing/usage.ts

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export interface TenantUsage {
  users: number;
  products: number;
  monthlyInvoices: number;
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

  const [userCount, productCount, monthInvoiceCount] = await Promise.all([
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
  ]);

  return {
    users: userCount,
    products: productCount,
    monthlyInvoices: monthInvoiceCount,
  };
}
