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
export async function getTopProducts(db: ScopedPrisma, limit = 5) {
  const topProducts = await db.salesInvoiceItem.groupBy({
    by: ['productId'],
    _sum: {
      total: true,
      quantity: true,
    },
    orderBy: {
      _sum: {
        total: 'desc',
      },
    },
    take: limit,
  });

  const productDetails = await db.product.findMany({
    where: {
      id: { in: topProducts.map(p => p.productId) },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return topProducts.map(tp => ({
    ...tp,
    name: productDetails.find(p => p.id === tp.productId)?.name || "Unknown Product",
  }));
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
