import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

import { formatMoney } from "./document-utils";

export interface PaymentReceiptPdfData {
  id: string;
  type: "IN" | "OUT";
  amount: number;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  date: Date | string;
  currency?: string | null;
  organization: {
    name: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    currency?: string | null;
  };
  branch?: {
    name: string;
  } | null;
  account?: {
    name: string;
    type?: string | null;
  } | null;
  customer?: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  supplier?: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  salesInvoice?: {
    invoiceNumber: string;
    totalAmount: number;
  } | null;
  purchaseInvoice?: {
    invoiceNumber: string;
    totalAmount: number;
  } | null;
}

export function generatePaymentReceiptPDF(data: PaymentReceiptPdfData): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currency = data.currency || data.organization.currency || "PKR";
  const counterparty = data.customer ?? data.supplier ?? null;
  const receiptLabel = data.type === "IN" ? "PAYMENT RECEIPT" : "PAYMENT VOUCHER";
  const directionLabel = data.type === "IN" ? "Amount received" : "Amount paid";
  const documentNumber =
    data.referenceNumber?.trim() ||
    data.salesInvoice?.invoiceNumber ||
    data.purchaseInvoice?.invoiceNumber ||
    data.id;
  let currentY = 20;

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, currentY, 14, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("WQ", margin + 3.1, currentY + 8.4);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text("WhatsQuery Payment Receipt", margin + 18, currentY + 5.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Proof of payment generated for your workspace ledger", margin + 18, currentY + 10.5);

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(receiptLabel, pageWidth - margin, currentY + 8, { align: "right" });

  currentY += 24;
  doc.setDrawColor(241, 245, 249);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("ISSUED BY", margin, currentY);
  doc.text("COUNTERPARTY", margin + 72, currentY);
  doc.text("REFERENCE", pageWidth - margin - 52, currentY);
  doc.text("PAYMENT DATE", pageWidth - margin - 2, currentY, { align: "right" });

  currentY += 6;
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.organization.name, margin, currentY);
  doc.text(counterparty?.name || "Walk-in / internal", margin + 72, currentY);
  doc.text(documentNumber, pageWidth - margin - 52, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.date), "MMM dd, yyyy"), pageWidth - margin, currentY, { align: "right" });

  currentY += 5;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (data.organization.email) {
    doc.text(data.organization.email, margin, currentY);
  }
  if (counterparty?.email) {
    doc.text(counterparty.email, margin + 72, currentY);
  }
  currentY += 4;
  if (data.organization.phone) {
    doc.text(data.organization.phone, margin, currentY);
  }
  if (counterparty?.phone) {
    doc.text(counterparty.phone, margin + 72, currentY);
  }
  currentY += 4;
  if (data.organization.address) {
    const orgLines = doc.splitTextToSize(data.organization.address, 60);
    doc.text(orgLines, margin, currentY);
    currentY += orgLines.length * 4;
  }
  if (counterparty?.address) {
    const counterpartyLines = doc.splitTextToSize(counterparty.address, 60);
    doc.text(counterpartyLines, margin + 72, currentY - 4);
  }

  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Field", "Value"]],
    body: [
      [directionLabel, formatMoney(data.amount, currency)],
      ["Payment method", data.paymentMethod || "Not specified"],
      ["Account", data.account?.name || "Unassigned"],
      ["Branch", data.branch?.name || "Not specified"],
      [
        "Linked document",
        data.salesInvoice?.invoiceNumber || data.purchaseInvoice?.invoiceNumber || "Standalone payment",
      ],
      [
        "Document total",
        data.salesInvoice?.totalAmount || data.purchaseInvoice?.totalAmount
          ? formatMoney(data.salesInvoice?.totalAmount || data.purchaseInvoice?.totalAmount || 0, currency)
          : "-",
      ],
    ],
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
      0: { cellWidth: 48, fontStyle: "bold" },
      1: { cellWidth: 110 },
    },
    didDrawPage: (arg: any) => {
      currentY = arg.cursor.y;
    },
  });

  currentY += 12;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.type === "IN" ? "Total Received" : "Total Paid", margin, currentY);
  doc.text(formatMoney(data.amount, currency), pageWidth - margin, currentY, { align: "right" });

  currentY += 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("NOTES", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(
    data.type === "IN"
      ? "This receipt confirms payment collected and recorded in the workspace ledger."
      : "This voucher confirms payment issued and recorded in the workspace ledger.",
    margin,
    currentY,
  );

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(data.organization.name.trim(), pageWidth / 2, pageHeight - 18, { align: "center" });
  doc.text("Generated using WhatsQuery.com", pageWidth / 2, pageHeight - 13, { align: "center" });
  doc.setFontSize(7);
  doc.text("Professional payment receipt generated for A4 printing and digital proof.", pageWidth / 2, pageHeight - 9, {
    align: "center",
  });

  return Buffer.from(doc.output("arraybuffer"));
}
