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
    storage: {
      bytes: null as number | null,
      status: "unmetered" as const,
      note: "Per-tenant storage is not yet attributable from the current local/S3 upload model.",
    },
  };
}

export async function getTopTenantUsageAnalytics(limit = 10) {
  const organizations = await prisma.organization.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          members: true,
          branches: true,
          customers: true,
          suppliers: true,
          products: true,
          salesInvoices: true,
          purchaseInvoices: true,
          exportRequests: true,
        },
      },
    },
  });

  const assistantUsage = await prisma.analyticsEvent.groupBy({
    by: ["organizationId"],
    _count: { _all: true },
    where: {
      organizationId: { in: organizations.map((organization) => organization.id) },
      name: {
        in: [
          "ASSISTANT_COMMAND_EXECUTED",
          "ASSISTANT_CREATE_CUSTOMER",
          "ASSISTANT_CREATE_INVOICE",
          "ASSISTANT_QUERY_EXECUTED",
        ],
      },
    },
  });

  const reportUsage = await prisma.analyticsEvent.groupBy({
    by: ["organizationId"],
    _count: { _all: true },
    where: {
      organizationId: { in: organizations.map((organization) => organization.id) },
      name: {
        in: ["REPORT_WORKSPACE_LOADED", "REPORT_SUMMARY_PDF_GENERATED"],
      },
    },
  });

  const assistantMap = new Map(assistantUsage.map((entry) => [entry.organizationId, entry._count._all]));
  const reportMap = new Map(reportUsage.map((entry) => [entry.organizationId, entry._count._all]));

  return organizations.map((organization) => {
    const totalRecords =
      organization._count.members +
      organization._count.branches +
      organization._count.customers +
      organization._count.suppliers +
      organization._count.products +
      organization._count.salesInvoices +
      organization._count.purchaseInvoices +
      organization._count.exportRequests;

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      counts: organization._count,
      totalRecords,
      assistantActions: assistantMap.get(organization.id) ?? 0,
      reportActions: reportMap.get(organization.id) ?? 0,
      storageBytes: null as number | null,
      storageStatus: "unmetered" as const,
    };
  });
}
