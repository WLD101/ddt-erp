// lib/pdf/invoice-generator.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate?: Date | string | null;
  status: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  currency?: string | null;
  organization: {
    name: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    currency?: string | null;
  };
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product: {
      name: string;
      unit?: string | null;
    };
  }>;
}

function formatMoney(amount: number, currency = "PKR") {
  const safeCurrency = currency?.trim() || "PKR";
  const symbol = safeCurrency.toUpperCase() === "PKR" ? "Rs." : safeCurrency.toUpperCase();
  return `${symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function generateInvoicePDF(data: InvoiceData): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  const currency = data.currency || data.organization.currency || "PKR";

  // 1. Header with WhatsQuery branding
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, currentY, 14, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("WQ", margin + 3.1, currentY + 8.4);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text("WhatsQuery Invoice", margin + 18, currentY + 5.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Generated for your workspace", margin + 18, currentY + 10.5);

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, currentY + 8, { align: "right" });
  
  currentY += 25;

  // 2. Billing & Invoice Details
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("BILLED TO", margin, currentY);
  doc.text("BUSINESS", margin + 70, currentY);

  doc.text("INVOICE NUMBER", pageWidth - margin - 50, currentY);
  doc.text("ISSUE DATE", pageWidth - margin - 20, currentY, { align: "right" });

  currentY += 6;
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont("helvetica", "bold");
  doc.text(data.customer.name, margin, currentY);
  doc.text(data.organization.name, margin + 70, currentY);

  doc.setFontSize(10);
  doc.text(data.invoiceNumber, pageWidth - margin - 50, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.issueDate), "MMM dd, yyyy"), pageWidth - margin, currentY, { align: "right" });

  currentY += 5;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (data.customer.email) {
    doc.text(data.customer.email, margin, currentY);
  }
  if (data.organization.email) {
    doc.text(data.organization.email, margin + 70, currentY);
  }
  currentY += 4;
  if (data.customer.phone) {
    doc.text(data.customer.phone, margin, currentY);
  }
  if (data.organization.phone) {
    doc.text(data.organization.phone, margin + 70, currentY);
  }
  currentY += 4;
  if (data.customer.address) {
    const addressLines = doc.splitTextToSize(data.customer.address, 60);
    doc.text(addressLines, margin, currentY);
    currentY += addressLines.length * 4;
  }
  if (data.organization.address) {
    const organizationAddressLines = doc.splitTextToSize(data.organization.address, 60);
    doc.text(organizationAddressLines, margin + 70, currentY - 4);
  }

  if (data.dueDate) {
    const dueDateY = currentY - 4;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("DUE DATE", pageWidth - margin - 20, dueDateY);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(format(new Date(data.dueDate), "MMM dd, yyyy"), pageWidth - margin, dueDateY + 4, { align: "right" });
  }

  currentY += 12;

  // 3. Status Badge
  const statusX = pageWidth - margin;
  const statusLabel = data.status.toUpperCase();
  const isPaid = statusLabel === "PAID" || statusLabel === "FINALIZED";
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const statusWidth = doc.getTextWidth(statusLabel) + 6;
  
  if (isPaid) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(22, 163, 74);
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(249, 115, 22);
    doc.setTextColor(249, 115, 22);
  }
  
  doc.roundedRect(statusX - statusWidth, currentY - 4, statusWidth, 6, 1, 1, "FD");
  doc.text(statusLabel, statusX - (statusWidth / 2), currentY, { align: "center" });
  
  currentY += 10;

  // 4. Table
  const tableRows = data.items.map((item) => [
    item.product.name,
    item.product.unit || "unit",
    item.quantity.toString(),
    formatMoney(item.unitPrice, currency),
    formatMoney(item.total, currency),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Item Description", "Unit", "Qty", "Unit Rate", "Line Total"]],
    body: tableRows,
    theme: "plain",
    headStyles: { 
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
      cellPadding: 4
    },
    columnStyles: {
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "right", cellWidth: 18 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 30 },
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      textColor: [51, 65, 85]
    },
    didDrawPage: (dataArg: any) => {
      currentY = dataArg.cursor.y;
    }
  });

  // 5. Totals
  currentY += 12;
  const totalBoxWidth = 70;
  const totalBoxX = pageWidth - margin - totalBoxWidth;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  
  doc.text("Subtotal", totalBoxX, currentY);
  doc.setTextColor(51, 65, 85);
  doc.text(formatMoney(data.subtotal, currency), pageWidth - margin, currentY, { align: "right" });

  if (data.discount > 0) {
    currentY += 6;
    doc.setTextColor(100, 116, 139);
    doc.text("Discount", totalBoxX, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatMoney(data.discount, currency)}`, pageWidth - margin, currentY, { align: "right" });
  }

  currentY += 6;
  doc.setTextColor(100, 116, 139);
  doc.text("Tax", totalBoxX, currentY);
  doc.setTextColor(51, 65, 85);
  doc.text(formatMoney(data.taxAmount, currency), pageWidth - margin, currentY, { align: "right" });

  currentY += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(totalBoxX, currentY - 4, pageWidth - margin, currentY - 4);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Final Payable", totalBoxX, currentY);
  doc.text(formatMoney(data.totalAmount, currency), pageWidth - margin, currentY, { align: "right" });

  // 6. Notes / payment terms
  if (data.notes) {
    currentY += 20;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT TERMS / NOTES", margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - (margin * 2));
    doc.text(noteLines, margin, currentY);
  }

  // 7. Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  const footerTenant = data.organization.name.trim();
  doc.text(footerTenant, pageWidth / 2, doc.internal.pageSize.getHeight() - 18, { align: "center" });
  const footerText = "Generated using WhatsQuery.com";
  doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 13, { align: "center" });
  doc.setFontSize(7);
  doc.text("Professional invoice generated for A4 printing and digital sharing.", pageWidth / 2, doc.internal.pageSize.getHeight() - 9, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
