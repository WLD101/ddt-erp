import { prisma } from "@/lib/prisma";
import { endOfMonth, startOfMonth } from "date-fns";

export async function getTenantUsageAnalytics(organizationId: string) {
  const periodStart = startOfMonth(new Date());
  const periodEnd = endOfMonth(new Date());

  const [
    customers,
    suppliers,
    products,
    users,
    branches,
    invoicesThisMonth,
    purchasesThisMonth,
    exportsThisMonth,
    reportActionsThisMonth,
    assistantActionsThisMonth,
  ] = await Promise.all([
    prisma.customer.count({ where: { organizationId } }),
    prisma.supplier.count({ where: { organizationId } }),
    prisma.product.count({ where: { organizationId } }),
    prisma.organizationUser.count({ where: { organizationId } }),
    prisma.branch.count({ where: { organizationId } }),
    prisma.salesInvoice.count({ where: { organizationId, createdAt: { gte: periodStart, lte: periodEnd } } }),
    prisma.purchaseInvoice.count({ where: { organizationId, createdAt: { gte: periodStart, lte: periodEnd } } }),
    prisma.exportRequest.count({ where: { organizationId, createdAt: { gte: periodStart, lte: periodEnd } } }),
    prisma.analyticsEvent.count({
      where: {
        organizationId,
        timestamp: { gte: periodStart, lte: periodEnd },
        name: { in: ["REPORT_WORKSPACE_LOADED", "REPORT_SUMMARY_PDF_GENERATED"] },
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        organizationId,
        timestamp: { gte: periodStart, lte: periodEnd },
        name: { in: ["ASSISTANT_COMMAND_EXECUTED", "ASSISTANT_CREATE_CUSTOMER", "ASSISTANT_CREATE_INVOICE", "ASSISTANT_QUERY_EXECUTED"] },
      },
    }),
  ]);

  return {
    periodStart,
    periodEnd,
    counts: {
      customers,
      suppliers,
      products,
      users,
      branches,
    },
    monthlyActivity: {
      invoicesThisMonth,
      purchasesThisMonth,
      exportsThisMonth,
      reportActionsThisMonth,
      assistantActionsThisMonth,
    },
  };
}
