import { performance } from "perf_hooks";

import { prisma } from "../lib/prisma";
import { getTenantStore } from "../lib/db/client";
import {
  writeCapacityBenchmark,
  type CapacityBenchmarkReport,
  type BenchmarkOperationKey,
} from "../lib/monitoring/benchmarks";
import { parseAssistantCommand } from "../modules/assistant/parser";

const DEFAULT_SIZES = [100, 500, 1000, 5000, 10000];

function parseArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

async function measure(fn: () => Promise<unknown>) {
  const started = performance.now();
  await fn();
  return Math.round(performance.now() - started);
}

async function main() {
  const requestedOrganizationId = parseArg("organization");
  const requestedSizes = parseArg("sizes");
  const sizes = requestedSizes
    ? requestedSizes
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0)
    : DEFAULT_SIZES;

  const organization = requestedOrganizationId
    ? await prisma.organization.findUnique({
        where: { id: requestedOrganizationId },
        include: { branches: { orderBy: { createdAt: "asc" }, take: 1 } },
      })
    : await prisma.organization.findFirst({
        orderBy: { createdAt: "asc" },
        include: { branches: { orderBy: { createdAt: "asc" }, take: 1 } },
      });

  if (!organization || organization.branches.length === 0) {
    throw new Error("No organization with an accessible branch was found for benchmarking.");
  }

  const branchId = organization.branches[0].id;
  const db = getTenantStore({
    userId: "benchmark-runner",
    organizationId: organization.id,
    branchId,
    role: "owner",
    permissions: [],
  });

  const [customerCount, productCount, invoiceCount, purchaseCount] = await Promise.all([
    prisma.customer.count({ where: { organizationId: organization.id } }),
    prisma.product.count({ where: { organizationId: organization.id } }),
    prisma.salesInvoice.count({ where: { organizationId: organization.id } }),
    prisma.purchaseInvoice.count({ where: { organizationId: organization.id } }),
  ]);

  const report: CapacityBenchmarkReport = {
    generatedAt: new Date().toISOString(),
    organizationId: organization.id,
    organizationName: organization.name,
    branchId,
    sampleAvailability: {
      customers: customerCount,
      products: productCount,
      invoices: invoiceCount,
      purchases: purchaseCount,
    },
    scenarios: [],
  };

  for (const size of sizes) {
    const actualRows = Math.min(size, Math.max(customerCount, productCount, invoiceCount, purchaseCount, 1));

    const timingsMs: Record<BenchmarkOperationKey, number | null> = {
      search: null,
      exports: null,
      reports: null,
      dashboard: null,
      assistant: null,
    };

    const notes: string[] = [];

    if (customerCount === 0 || productCount === 0) {
      notes.push("Limited sample data reduced benchmark realism for search/export/assistant flows.");
    }

    timingsMs.search = await measure(async () => {
      await prisma.customer.findMany({
        where: { organizationId: organization.id },
        select: { id: true, name: true, email: true, phone: true },
        orderBy: { createdAt: "desc" },
        take: actualRows,
      });
    });

    timingsMs.exports = await measure(async () => {
      await prisma.product.findMany({
        where: { organizationId: organization.id },
        select: { id: true, name: true, sku: true, unitPrice: true, costPrice: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: actualRows,
      });
    });

    timingsMs.reports = await measure(async () => {
      await Promise.all([
        prisma.salesInvoice.aggregate({
          where: { organizationId: organization.id },
          _sum: { total: true },
          _count: { _all: true },
        }),
        prisma.purchaseInvoice.aggregate({
          where: { organizationId: organization.id },
          _sum: { total: true },
          _count: { _all: true },
        }),
        prisma.salesInvoice.findMany({
          where: { organizationId: organization.id },
          select: { id: true, invoiceNumber: true, total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: Math.min(actualRows, 1000),
        }),
      ]);
    });

    timingsMs.dashboard = await measure(async () => {
      await Promise.all([
        prisma.customer.count({ where: { organizationId: organization.id } }),
        prisma.product.count({ where: { organizationId: organization.id } }),
        prisma.salesInvoice.count({ where: { organizationId: organization.id } }),
        prisma.purchaseInvoice.count({ where: { organizationId: organization.id } }),
        prisma.exportRequest.count({ where: { organizationId: organization.id } }),
      ]);
    });

    timingsMs.assistant = await measure(async () => {
      await parseAssistantCommand(db, branchId, "Create customer Ashraf Cloth House");
      await parseAssistantCommand(db, branchId, "Ali Traders ke naam invoice banao");
      await parseAssistantCommand(db, branchId, "آج کی سیلز رپورٹ دکھائیں");
    });

    report.scenarios.push({
      size,
      actualRows,
      timingsMs,
      notes,
    });
  }

  await writeCapacityBenchmark(report);
  console.log(JSON.stringify(report, null, 2));
}

(async () => {
  try {
    await main();
  } catch (error) {
    console.error("[capacity-benchmark]", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
})();
