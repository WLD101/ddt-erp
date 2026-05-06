/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ScopedPrisma } from "@/lib/db/client";
import { format } from "date-fns";

/**
 * SERVICE: KPI METRICS
 */
/**
 * SERVICE: KPI METRICS
 */
export async function getDashboardMetrics(
  db: ScopedPrisma, 
  branchId: string,
  fromDate?: string, 
  toDate?: string
) {
  const dateFilter = fromDate && toDate ? { 
    createdAt: { gte: new Date(fromDate), lte: new Date(toDate) } 
  } : undefined;

  const [salesAgg, returnsAgg, expensesAgg, salesItems, accountsAgg] = await Promise.all([
    db.salesInvoice.aggregate({
      where: { 
        branchId,
        ...(dateFilter ? { createdAt: dateFilter.createdAt } : {})
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    db.salesReturn.aggregate({
      where: {
        branchId,
        ...(dateFilter ? { createdAt: dateFilter.createdAt } : {})
      },
      _sum: { totalAmount: true }
    }),
    db.expense.aggregate({
      where: { 
        branchId,
        ...(dateFilter ? { date: dateFilter.createdAt } : {})
      },
      _sum: { amount: true },
    }),
    db.salesInvoiceItem.findMany({
      where: { 
        invoice: { 
          branchId,
          ...(dateFilter ? { createdAt: dateFilter.createdAt } : {})
        } 
      },
      select: {
        quantity: true,
        product: { select: { costPrice: true } },
      },
    }),
    db.financialAccount.findMany({
      where: { isActive: true },
      select: { type: true, currentBalance: true }
    })
  ]);

  const grossRevenue = salesAgg._sum.totalAmount ?? 0;
  const totalReturnsValue = returnsAgg._sum.totalAmount ?? 0;
  const totalRevenue = Math.max(0, grossRevenue - totalReturnsValue);
  
  const totalSalesCount = salesAgg._count.id;
  const totalExpenses = expensesAgg._sum.amount ?? 0;

  const totalCOGS = salesItems.reduce(
    (acc, item) => acc + item.quantity * (item.product.costPrice ?? 0),
    0
  );

  const totalLiquidity = accountsAgg.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalCash = accountsAgg.filter(a => a.type === 'CASH').reduce((sum, a) => sum + a.currentBalance, 0);
  const totalBankValue = accountsAgg.filter(a => a.type === 'BANK').reduce((sum, a) => sum + a.currentBalance, 0);

  const grossProfit = totalRevenue - totalCOGS - totalExpenses;

  return {
    totalRevenue,
    grossRevenue,
    totalReturnsValue,
    totalSalesCount,
    grossProfit,
    totalExpenses,
    totalCOGS,
    totalLiquidity,
    totalCash,
    totalBankValue
  };
}

/**
 * SERVICE: FINANCIAL TRENDS
 */
export async function getFinancialTrends(
  db: ScopedPrisma,
  branchId: string,
  days = 30, 
  fromDate?: string, 
  toDate?: string, 
  interval: "day" | "week" | "month" = "day"
) {
  const start = fromDate ? new Date(fromDate) : new Date();
  if (!fromDate) start.setDate(start.getDate() - days);
  const end = toDate ? new Date(toDate) : new Date();

  const [sales, purchases, expenses] = await Promise.all([
    db.salesInvoice.findMany({
      where: { branchId, date: { gte: start, lte: end } },
      select: { date: true, totalAmount: true }
    }),
    db.purchaseInvoice.findMany({
      where: { branchId, issueDate: { gte: start, lte: end } },
      select: { issueDate: true, totalAmount: true }
    }),
    db.expense.findMany({
      where: { branchId, date: { gte: start, lte: end } },
      select: { date: true, amount: true }
    }),
  ]);

  const trends: Record<string, { revenue: number, purchases: number, expenses: number }> = {};

  const getGroupKey = (date: Date) => {
    if (interval === "month") return format(date, "yyyy-MM");
    if (interval === "week") return format(date, "yyyy-'W'ww");
    return date.toISOString().split("T")[0];
  };

  sales.forEach(s => {
    const key = getGroupKey(s.date);
    if (!trends[key]) trends[key] = { revenue: 0, purchases: 0, expenses: 0 };
    trends[key].revenue += s.totalAmount;
  });

  purchases.forEach(p => {
    const key = getGroupKey(p.issueDate);
    if (!trends[key]) trends[key] = { revenue: 0, purchases: 0, expenses: 0 };
    trends[key].purchases += p.totalAmount;
  });

  expenses.forEach(e => {
    const key = getGroupKey(e.date);
    if (!trends[key]) trends[key] = { revenue: 0, purchases: 0, expenses: 0 };
    trends[key].expenses += e.amount;
  });

  return Object.entries(trends)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ 
      date, 
      ...vals,
      profit: vals.revenue - vals.purchases - vals.expenses
    }));
}

/**
 * SERVICE: RECENT TRANSACTIONS
 */
export async function getRecentTransactions(db: ScopedPrisma, branchId: string, limit = 10) {
  const [sales, purchases] = await Promise.all([
    db.salesInvoice.findMany({
      where: { branchId },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.purchaseInvoice.findMany({
      where: { branchId },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  return [
    ...sales.map(s => ({
      id: s.id,
      type: "SALE" as const,
      number: s.invoiceNumber,
      entity: s.customer.name,
      amount: s.totalAmount,
      date: s.date,
      status: s.status,
    })),
    ...purchases.map(p => ({
      id: p.id,
      type: "PURCHASE" as const,
      number: p.invoiceNumber,
      entity: p.supplier.name,
      amount: p.totalAmount,
      date: p.date,
      status: p.status,
    })),
  ]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, limit);
}

/**
 * SERVICE: TOP SELLING PRODUCTS
 */
export async function getTopProducts(db: ScopedPrisma, branchId: string, limit = 5) {
  const salesItems = await db.salesInvoiceItem.findMany({
    where: {
      invoice: {
        branchId,
      },
    },
    select: {
      productId: true,
      quantity: true,
      total: true,
      product: {
        select: {
          name: true,
          sku: true,
        },
      },
    },
  });

  const totalsByProduct = new Map<
    string,
    {
      productId: string;
      name: string;
      sku: string;
      revenue: number;
      quantity: number;
    }
  >();

  for (const item of salesItems) {
    const existing = totalsByProduct.get(item.productId) ?? {
      productId: item.productId,
      name: item.product.name,
      sku: item.product.sku ?? "No SKU",
      revenue: 0,
      quantity: 0,
    };

    existing.revenue += item.total ?? 0;
    existing.quantity += item.quantity ?? 0;
    totalsByProduct.set(item.productId, existing);
  }

  return Array.from(totalsByProduct.values())
    .sort((left, right) => {
      if (right.revenue !== left.revenue) {
        return right.revenue - left.revenue;
      }

      return right.quantity - left.quantity;
    })
    .slice(0, limit);
}

/**
 * SERVICE: OUTSTANDING BALANCES
 */
export async function getOutstandingBalances(db: ScopedPrisma) {
  const [customers, suppliers] = await Promise.all([
    db.customer.findMany({
      include: {
        salesInvoices: {
          where: { status: { notIn: ["PAID", "VOID"] } },
          select: { totalAmount: true }
        }
      }
    }),
    db.supplier.findMany({
      include: {
        purchaseInvoices: {
          where: { status: { notIn: ["PAID", "VOID"] } },
          select: { totalAmount: true }
        }
      }
    })
  ]);

  return {
    customerBalances: customers.map(c => ({
      name: c.name,
      balance: c.salesInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0)
    })).filter(c => c.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 5),
    supplierBalances: suppliers.map(s => ({
      name: s.name,
      balance: s.purchaseInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0)
    })).filter(s => s.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 5)
  };
}

const ECOMMERCE_CHANNEL_TYPES = ["DARAZ", "SHOPIFY", "WOOCOMMERCE", "CSV"];

function parseJsonRecord(value) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfTomorrow() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

function startOfWeek() {
  const date = startOfToday();
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offset);
  return date;
}

function getExternalQuantity(metadata) {
  const record = parseJsonRecord(metadata);
  const candidates = [
    record.quantity,
    record.stockQuantity,
    record.inventoryQuantity,
    record.available,
    record.stock,
    record.stock_level,
    record.stockLevel,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function channelLabel(channel) {
  if (channel?.name?.trim()) {
    return channel.name.trim();
  }

  switch (channel?.type) {
    case "DARAZ":
      return "Daraz";
    case "SHOPIFY":
      return "Shopify";
    case "WOOCOMMERCE":
      return "WooCommerce";
    case "CSV":
      return "CSV / Excel";
    default:
      return "Channel";
  }
}

export async function getEcommerceIntelligence(db: ScopedPrisma, branchId: string) {
  const todayStart = startOfToday();
  const weekStart = startOfWeek();

  const channels = await db.salesChannel.findMany({
    where: {
      isActive: true,
      type: { in: ECOMMERCE_CHANNEL_TYPES },
    },
    select: {
      id: true,
      name: true,
      type: true,
      syncStatus: true,
      syncError: true,
      lastSyncAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const channelIds = channels.map((channel) => channel.id);

  const [
    products,
    inventoryItems,
    productMaps,
    orderMaps,
    importJobs,
    ecommerceSalesItems,
  ] = await Promise.all([
    db.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
      },
    }),
    db.inventoryItem.findMany({
      where: { branchId },
      select: {
        productId: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            lowStockThreshold: true,
          },
        },
      },
    }),
    channelIds.length > 0
      ? db.externalProductMap.findMany({
          where: {
            salesChannelId: { in: channelIds },
          },
          select: {
            productId: true,
            metadata: true,
            salesChannelId: true,
          },
        })
      : Promise.resolve([]),
    channelIds.length > 0
      ? db.externalOrderMap.findMany({
          where: {
            salesChannelId: { in: channelIds },
          },
          select: {
            salesInvoiceId: true,
            salesChannelId: true,
            salesInvoice: {
              select: {
                id: true,
                date: true,
                totalAmount: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    db.importJob.findMany({
      where: {
        importType: "ORDERS",
      },
      select: {
        status: true,
        failedRows: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),
    db.salesInvoiceItem.findMany({
      where: {
        invoice: {
          branchId,
          date: { gte: weekStart },
          ExternalOrderMap: {
            some: {},
          },
        },
      },
      select: {
        quantity: true,
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
    }),
  ]);

  // Build lookup map since ExternalProductMap/OrderMap have no Prisma relation to SalesChannel
  const channelById = new Map(channels.map((ch) => [ch.id, ch]));

  const inventoryByProductId = new Map();
  for (const item of inventoryItems) {
    inventoryByProductId.set(
      item.productId,
      (inventoryByProductId.get(item.productId) ?? 0) + item.quantity
    );
  }

  const mappedProductIds = new Set(productMaps.map((map) => map.productId));
  const lowStockProducts = inventoryItems
    .filter((item) => {
      const threshold = item.product.lowStockThreshold ?? 0;
      return item.quantity <= threshold && mappedProductIds.has(item.productId);
    })
    .sort((left, right) => left.quantity - right.quantity)
    .slice(0, 5)
    .map((item) => ({
      id: item.product.id,
      name: item.product.name,
      sku: item.product.sku ?? "No SKU",
      quantity: item.quantity,
      threshold: item.product.lowStockThreshold ?? 0,
    }));

  const revenueByChannelMap = new Map();
  let totalOrdersToday = 0;
  let ordersNotYetImported = 0;

  for (const map of orderMaps) {
    const channel = channelById.get(map.salesChannelId ?? "");
    const label = channelLabel(channel);
    const existing = revenueByChannelMap.get(label) ?? {
      channelId: channel?.id ?? map.salesChannelId ?? "",
      channelName: label,
      channelType: channel?.type ?? "UNKNOWN",
      revenue: 0,
      orders: 0,
    };

    if (!map.salesInvoiceId) {
      ordersNotYetImported += 1;
    }

    if (map.salesInvoice) {
      if (map.salesInvoice.date >= todayStart) {
        totalOrdersToday += 1;
      }

      if (map.salesInvoice.date >= weekStart) {
        existing.revenue += map.salesInvoice.totalAmount ?? 0;
        existing.orders += 1;
      }
    }

    revenueByChannelMap.set(label, existing);
  }

  for (const job of importJobs) {
    if (job.status === "FAILED" || job.status === "PARTIAL") {
      ordersNotYetImported += job.failedRows ?? 0;
    }
  }

  const revenueByChannel = Array.from(revenueByChannelMap.values())
    .sort((left, right) => right.revenue - left.revenue)
    .map((entry) => ({
      ...entry,
      share: 0,
    }));

  const ecommerceRevenueTotal = revenueByChannel.reduce((sum, channel) => sum + channel.revenue, 0);

  for (const channel of revenueByChannel) {
    channel.share = ecommerceRevenueTotal > 0 ? (channel.revenue / ecommerceRevenueTotal) * 100 : 0;
  }

  const topSellingChannel = revenueByChannel[0] ?? null;
  const unmappedProducts = products.filter((product) => !mappedProductIds.has(product.id));

  const mismatchByChannel = new Map();
  const mismatchProducts = [];

  for (const map of productMaps) {
    const externalQuantity = getExternalQuantity(map.metadata);
    if (externalQuantity === null) {
      continue;
    }

    const erpQuantity = inventoryByProductId.get(map.productId) ?? 0;
    if (erpQuantity === externalQuantity) {
      continue;
    }

    const channel = channelById.get(map.salesChannelId ?? "");
    const label = channelLabel(channel);
    const channelMismatch = mismatchByChannel.get(label) ?? {
      channelName: label,
      lowerThanErp: 0,
      higherThanErp: 0,
    };

    if (externalQuantity < erpQuantity) {
      channelMismatch.lowerThanErp += 1;
    } else {
      channelMismatch.higherThanErp += 1;
    }

    mismatchByChannel.set(label, channelMismatch);
    mismatchProducts.push({
      productId: map.productId,
      channelName: label,
      erpQuantity,
      externalQuantity,
    });
  }

  const topSkuMap = new Map();
  for (const item of ecommerceSalesItems) {
    const key = item.product.sku?.trim() || item.product.name;
    const existing = topSkuMap.get(key) ?? {
      sku: item.product.sku?.trim() || "No SKU",
      name: item.product.name,
      quantity: 0,
    };

    existing.quantity += item.quantity ?? 0;
    topSkuMap.set(key, existing);
  }

  const topSellingSku = Array.from(topSkuMap.values()).sort((left, right) => right.quantity - left.quantity)[0] ?? null;
  const leadingMismatch = Array.from(mismatchByChannel.values()).sort(
    (left, right) => (right.lowerThanErp + right.higherThanErp) - (left.lowerThanErp + left.higherThanErp)
  )[0] ?? null;

  const insights = [];

  if (leadingMismatch?.lowerThanErp) {
    insights.push(`${leadingMismatch.channelName} stock is lower than ERP stock for ${leadingMismatch.lowerThanErp} product${leadingMismatch.lowerThanErp === 1 ? "" : "s"}.`);
  }

  if (topSellingChannel && ecommerceRevenueTotal > 0) {
    insights.push(`${topSellingChannel.channelName} generated ${Math.round(topSellingChannel.share)}% of this week's online revenue.`);
  }

  if (unmappedProducts.length > 0) {
    insights.push(`${unmappedProducts.length} product${unmappedProducts.length === 1 ? "" : "s"} ${unmappedProducts.length === 1 ? "has" : "have"} no channel mapping yet.`);
  }

  if (topSellingSku) {
    insights.push(`Your top selling SKU this week is ${topSellingSku.sku}.`);
  }

  if (ordersNotYetImported > 0) {
    insights.push(`${ordersNotYetImported} order${ordersNotYetImported === 1 ? "" : "s"} still need import review.`);
  }

  return {
    hasChannels: channels.length > 0,
    channelCount: channels.length,
    totalEcommerceOrdersToday: totalOrdersToday,
    revenueByChannel,
    ecommerceRevenueTotal,
    topSellingChannel: topSellingChannel
      ? {
          name: topSellingChannel.channelName,
          revenue: topSellingChannel.revenue,
          share: topSellingChannel.share,
          orders: topSellingChannel.orders,
        }
      : null,
    lowStockAcrossChannels: {
      count: lowStockProducts.length,
      products: lowStockProducts,
    },
    unmappedProductsCount: unmappedProducts.length,
    ordersNotYetImported,
    stockMismatchCount: mismatchProducts.length,
    topSellingSku,
    insights: insights.slice(0, 4),
    channels: channels.map((channel) => ({
      id: channel.id,
      name: channelLabel(channel),
      type: channel.type,
      syncStatus: channel.syncStatus,
      syncError: channel.syncError,
      lastSyncAt: channel.lastSyncAt,
    })),
  };
}

function startOfDaysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function parseConfigurationValue(value) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export async function getBusinessHealthScore(db: ScopedPrisma, branchId: string) {
  const currentPeriodStart = startOfDaysAgo(30);
  const previousPeriodStart = startOfDaysAgo(60);
  const today = new Date();

  const [
    currentRevenueAgg,
    currentSalesAgg,
    previousRevenueAgg,
    currentExpensesAgg,
    unpaidInvoices,
    lowStockItems,
  ] = await Promise.all([
    db.salesInvoice.aggregate({
      where: {
        branchId,
        date: {
          gte: currentPeriodStart,
          lte: today,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    db.salesInvoice.aggregate({
      where: {
        branchId,
        date: {
          gte: currentPeriodStart,
          lte: today,
        },
      },
      _count: {
        id: true,
      },
    }),
    db.salesInvoice.aggregate({
      where: {
        branchId,
        date: {
          gte: previousPeriodStart,
          lt: currentPeriodStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    db.expense.aggregate({
      where: {
        branchId,
        date: {
          gte: currentPeriodStart,
          lte: today,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    db.salesInvoice.findMany({
      where: {
        branchId,
        status: {
          notIn: ["PAID", "VOID"],
        },
      },
      select: {
        totalAmount: true,
      },
    }),
    db.inventoryItem.findMany({
      where: {
        branchId,
      },
      select: {
        quantity: true,
        product: {
          select: {
            name: true,
            lowStockThreshold: true,
          },
        },
      },
    }),
  ]);

  const currentRevenue = currentRevenueAgg._sum.totalAmount ?? 0;
  const currentSalesCount = currentSalesAgg._count.id ?? 0;
  const previousRevenue = previousRevenueAgg._sum.totalAmount ?? 0;
  const currentExpenses = currentExpensesAgg._sum.amount ?? 0;
  const unpaidAmount = unpaidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const lowStockCount = lowStockItems.filter(
    (item) => item.quantity <= (item.product.lowStockThreshold ?? 0)
  ).length;

  const revenueRatio =
    previousRevenue > 0 ? (currentRevenue - previousRevenue) / previousRevenue : currentRevenue > 0 ? 1 : 0;
  const expenseRatio = currentRevenue > 0 ? currentExpenses / currentRevenue : currentExpenses > 0 ? 1 : 0;
  const unpaidRatio = currentRevenue > 0 ? unpaidAmount / currentRevenue : unpaidAmount > 0 ? 1 : 0;

  let score = 100;
  const drivers = [];

  if (revenueRatio >= 0.1) {
    drivers.push("Revenue is trending up over the last 30 days.");
  } else if (revenueRatio >= 0) {
    score -= 5;
    drivers.push("Revenue is stable, but not accelerating yet.");
  } else if (revenueRatio > -0.15) {
    score -= 12;
    drivers.push("Revenue softened compared with the previous month.");
  } else {
    score -= 22;
    drivers.push("Revenue dropped materially versus the previous month.");
  }

  if (unpaidRatio > 0.45) {
    score -= 24;
    drivers.push("A large share of sales is still unpaid.");
  } else if (unpaidRatio > 0.2) {
    score -= 14;
    drivers.push("Unpaid invoices are starting to weigh on cash flow.");
  } else if (unpaidInvoices.length > 0) {
    score -= 6;
    drivers.push("There are some unpaid invoices to follow up.");
  } else {
    drivers.push("Collections look healthy right now.");
  }

  if (lowStockCount >= 10) {
    score -= 18;
    drivers.push("Several products are below reorder level.");
  } else if (lowStockCount >= 4) {
    score -= 10;
    drivers.push("A few products need restocking soon.");
  } else if (lowStockCount > 0) {
    score -= 4;
    drivers.push("Low stock is manageable but worth watching.");
  } else {
    drivers.push("Stock coverage looks healthy.");
  }

  if (expenseRatio > 0.8) {
    score -= 18;
    drivers.push("Expenses are consuming most of current revenue.");
  } else if (expenseRatio > 0.55) {
    score -= 10;
    drivers.push("Expenses are elevated compared with sales.");
  } else if (expenseRatio > 0.35) {
    score -= 4;
    drivers.push("Expenses are under control, but worth monitoring.");
  } else {
    drivers.push("Expense levels are efficient relative to revenue.");
  }

  if (currentSalesCount === 0) {
    score -= 24;
    drivers.push("No sales activity has been recorded in the last 30 days.");
  } else if (currentSalesCount < 8) {
    score -= 12;
    drivers.push("Sales activity is light and could use a push this month.");
  } else if (currentSalesCount < 15) {
    score -= 5;
    drivers.push("Sales activity is steady, with room to grow.");
  } else {
    drivers.push("Sales activity is healthy for the current period.");
  }

  score = Math.max(28, Math.min(100, Math.round(score)));

  let label = "Strong";
  let tone = "healthy";
  if (score < 55) {
    label = "Needs attention";
    tone = "warning";
  } else if (score < 75) {
    label = "Stable";
    tone = "steady";
  }

  return {
    score,
    label,
    tone,
    revenueTrendPercent: Math.round(revenueRatio * 100),
    unpaidInvoicesCount: unpaidInvoices.length,
    unpaidAmount,
    lowStockCount,
    expenseRatioPercent: Math.round(expenseRatio * 100),
    salesActivityCount: currentSalesCount,
    drivers: drivers.slice(0, 4),
  };
}

export async function getTodaysBusinessSummary(db: ScopedPrisma, branchId: string) {
  const todayStart = startOfToday();
  const tomorrowStart = startOfTomorrow();

  const [salesAgg, purchasesAgg, expensesAgg, salesItems] = await Promise.all([
    db.salesInvoice.aggregate({
      where: {
        branchId,
        date: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    }),
    db.purchaseInvoice.aggregate({
      where: {
        branchId,
        issueDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    }),
    db.expense.aggregate({
      where: {
        branchId,
        date: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),
    db.salesInvoiceItem.findMany({
      where: {
        invoice: {
          branchId,
          date: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
      },
      select: {
        quantity: true,
        product: {
          select: {
            costPrice: true,
          },
        },
      },
    }),
  ]);

  const salesToday = salesAgg._sum.totalAmount ?? 0;
  const purchasesToday = purchasesAgg._sum.totalAmount ?? 0;
  const expensesToday = expensesAgg._sum.amount ?? 0;
  const ordersCount = salesAgg._count.id ?? 0;
  const purchaseCount = purchasesAgg._count.id ?? 0;
  const expenseCount = expensesAgg._count.id ?? 0;
  const todaysCogs = salesItems.reduce(
    (total, item) => total + (item.quantity ?? 0) * (item.product.costPrice ?? 0),
    0
  );

  return {
    salesToday,
    purchasesToday,
    expensesToday,
    profitEstimate: salesToday - todaysCogs - expensesToday,
    ordersCount,
    purchaseCount,
    expenseCount,
    isEmpty:
      salesToday === 0 &&
      purchasesToday === 0 &&
      expensesToday === 0 &&
      ordersCount === 0,
  };
}

export async function getEcommerceSyncSummary(db: ScopedPrisma) {
  const channels = await db.salesChannel.findMany({
    where: {
      type: {
        in: ["DARAZ", "SHOPIFY", "WOOCOMMERCE"],
      },
    },
    select: {
      id: true,
      name: true,
      type: true,
      syncStatus: true,
      syncError: true,
      lastSyncAt: true,
      configuration: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Fetch counts separately (SQLite doesn't support _count in select)
  const channelIds = channels.map((c) => c.id);
  const [orderCounts, productCounts] = await Promise.all([
    channelIds.length > 0
      ? db.externalOrderMap.groupBy({
          by: ["salesChannelId"],
          where: { salesChannelId: { in: channelIds } },
          _count: { salesChannelId: true },
        })
      : Promise.resolve([]),
    channelIds.length > 0
      ? db.externalProductMap.groupBy({
          by: ["salesChannelId"],
          where: { salesChannelId: { in: channelIds } },
          _count: { salesChannelId: true },
        })
      : Promise.resolve([]),
  ]);

  const orderCountMap = new Map(orderCounts.map((r: any) => [r.salesChannelId, r._count.salesChannelId]));
  const productCountMap = new Map(productCounts.map((r: any) => [r.salesChannelId, r._count.salesChannelId]));

  const channelTypes = ["DARAZ", "SHOPIFY", "WOOCOMMERCE"];

  return channelTypes.map((type) => {
    const channel = channels.find((entry) => entry.type === type);
    const configuration = parseConfigurationValue(channel?.configuration);
    const demoMode =
      configuration.useMock === true ||
      (type === "DARAZ" && process.env.DARAZ_DEMO_MODE === "true");

    return {
      type,
      name: channelLabel(channel ?? { type, name: null }),
      isConnected: Boolean(channel),
      mode: !channel ? "Not connected" : demoMode ? "Demo" : "Live",
      syncStatus: channel?.syncStatus ?? "NOT_CONNECTED",
      lastSyncAt: channel?.lastSyncAt ?? null,
      ordersSynced: channel ? (orderCountMap.get(channel.id) ?? 0) : 0,
      productsSynced: channel ? (productCountMap.get(channel.id) ?? 0) : 0,
      syncError: channel?.syncError ?? null,
    };
  });
}

export async function getLowStockAlerts(db: ScopedPrisma) {
  const items = await db.inventoryItem.findMany({
    include: {
      product: true,
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ quantity: "asc" }, { product: { name: "asc" } }],
  });

  return items
    .filter((item) => item.quantity <= (item.product.lowStockThreshold ?? 0))
    .map((item) => ({
      ...item,
      branchName: item.branch.name,
      alertLevel:
        item.quantity === 0 ||
        item.quantity <= Math.max(1, Math.floor((item.product.lowStockThreshold ?? 0) / 2))
          ? "URGENT"
          : "NORMAL",
    }));
}
