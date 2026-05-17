import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatMoney } from "./document-utils";

type MetricSummary = {
  totalRevenue: number;
  grossProfit: number;
  totalCOGS: number;
  totalExpenses: number;
  totalSalesCount: number;
  totalLiquidity?: number;
};

type TrendPoint = {
  date: string;
  revenue: number;
  purchases: number;
  expenses: number;
  profit: number;
};

type TransactionItem = {
  id: string;
  type: "SALE" | "PURCHASE";
  number?: string | null;
  entity: string;
  amount: number;
  date: Date | string;
  status?: string | null;
};

type TopProduct = {
  productId: string;
  name: string;
  sku?: string | null;
  revenue: number;
  quantity: number;
};

type BalanceEntry = {
  name: string;
  balance: number;
};

export type ReportSummaryPdfData = {
  organizationName: string;
  currency?: string | null;
  generatedAt: Date | string;
  fromDate?: string;
  toDate?: string;
  interval: "day" | "week" | "month";
  metrics: MetricSummary;
  trends: TrendPoint[];
  transactions: TransactionItem[];
  topProducts: TopProduct[];
  balances: {
    customerBalances: BalanceEntry[];
    supplierBalances: BalanceEntry[];
  };
};

function describeRange(fromDate?: string, toDate?: string) {
  if (fromDate && toDate) {
    return `${format(new Date(fromDate), "MMM dd, yyyy")} - ${format(new Date(toDate), "MMM dd, yyyy")}`;
  }

  return "Last 30 days";
}

export function generateReportSummaryPDF(data: ReportSummaryPdfData): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const currency = data.currency || "PKR";
  const rangeLabel = describeRange(data.fromDate, data.toDate);
  let currentY = 18;

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, currentY, 14, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("WQ", margin + 3.1, currentY + 8.4);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text("WhatsQuery Report Summary", margin + 18, currentY + 5.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(data.organizationName, margin + 18, currentY + 10.5);

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SUMMARY", pageWidth - margin, currentY + 7, { align: "right" });

  currentY += 24;
  doc.setDrawColor(241, 245, 249);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 9;

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("REPORT RANGE", margin, currentY);
  doc.text("INTERVAL", margin + 72, currentY);
  doc.text("GENERATED", pageWidth - margin, currentY, { align: "right" });

  currentY += 5;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(rangeLabel, margin, currentY);
  doc.text(data.interval.toUpperCase(), margin + 72, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.generatedAt), "MMM dd, yyyy HH:mm"), pageWidth - margin, currentY, { align: "right" });

  currentY += 12;

  const metricRows = [
    ["Total Revenue", formatMoney(data.metrics.totalRevenue, currency)],
    ["Gross Profit", formatMoney(data.metrics.grossProfit, currency)],
    ["COGS", formatMoney(data.metrics.totalCOGS, currency)],
    ["Expenses", formatMoney(data.metrics.totalExpenses, currency)],
    ["Sales Count", data.metrics.totalSalesCount.toString()],
    ["Liquidity", formatMoney(data.metrics.totalLiquidity ?? 0, currency)],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Key Metric", "Value"]],
    body: metricRows,
    theme: "plain",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      cellPadding: 4,
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      1: { halign: "right", cellWidth: 50 },
    },
    didDrawPage: (arg: any) => {
      currentY = arg.cursor.y;
    },
  });

  currentY += 10;

  const trendRows = data.trends.slice(-6).map((trend) => [
    trend.date,
    formatMoney(trend.revenue, currency),
    formatMoney(trend.purchases, currency),
    formatMoney(trend.expenses, currency),
    formatMoney(trend.profit, currency),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Trend Point", "Revenue", "Purchases", "Expenses", "Profit"]],
    body:
      trendRows.length > 0
        ? trendRows
        : [["No trend data available", "-", "-", "-", "-"]],
    theme: "plain",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      cellPadding: 4,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 4,
      textColor: [51, 65, 85],
    },
    didDrawPage: (arg: any) => {
      currentY = arg.cursor.y;
    },
  });

  currentY += 10;

  const productRows = data.topProducts.slice(0, 5).map((product) => [
    product.name,
    product.quantity.toString(),
    formatMoney(product.revenue, currency),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Top Product", "Units", "Revenue"]],
    body: productRows.length > 0 ? productRows : [["No top products yet", "-", "-"]],
    theme: "plain",
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      cellPadding: 4,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 4,
      textColor: [51, 65, 85],
    },
    didDrawPage: (arg: any) => {
      currentY = arg.cursor.y;
    },
  });

  currentY += 10;

  const outstandingRows = [
    ...data.balances.customerBalances.slice(0, 3).map((entry) => [
      "Receivable",
      entry.name,
      formatMoney(entry.balance, currency),
    ]),
    ...data.balances.supplierBalances.slice(0, 3).map((entry) => [
      "Payable",
      entry.name,
      formatMoney(entry.balance, currency),
    ]),
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Balance Type", "Entity", "Amount"]],
    body: outstandingRows.length > 0 ? outstandingRows : [["No outstanding balances", "-", "-"]],
    theme: "plain",
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      cellPadding: 4,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 4,
      textColor: [51, 65, 85],
    },
    didDrawPage: (arg: any) => {
      currentY = arg.cursor.y;
    },
  });

  currentY += 10;

  const transactionRows = data.transactions.slice(0, 8).map((transaction) => [
    transaction.type,
    transaction.number || "UNNAMED",
    transaction.entity,
    format(new Date(transaction.date), "MMM dd, yyyy"),
    formatMoney(transaction.amount, currency),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Type", "Reference", "Entity", "Date", "Amount"]],
    body: transactionRows.length > 0 ? transactionRows : [["No recent transactions", "-", "-", "-", "-"]],
    theme: "plain",
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      cellPadding: 4,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 4,
      textColor: [51, 65, 85],
    },
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(data.organizationName, pageWidth / 2, pageHeight - 18, { align: "center" });
  doc.text("Generated using WhatsQuery.com", pageWidth / 2, pageHeight - 13, { align: "center" });
  doc.setFontSize(7);
  doc.text("Operational report summary prepared for A4 printing and internal review.", pageWidth / 2, pageHeight - 9, {
    align: "center",
  });

  return Buffer.from(doc.output("arraybuffer"));
}
