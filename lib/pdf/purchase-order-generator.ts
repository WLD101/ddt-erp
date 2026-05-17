import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

import { formatMoney } from "./document-utils";

export interface PurchaseOrderPdfData {
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate?: Date | string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency?: string | null;
  organization: {
    name: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    currency?: string | null;
  };
  supplier: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitCost: number;
    total: number;
    product: {
      name: string;
      unit?: string | null;
    };
  }>;
}

export function generatePurchaseOrderPDF(data: PurchaseOrderPdfData): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currency = data.currency || data.organization.currency || "PKR";
  let currentY = 20;

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, currentY, 14, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("WQ", margin + 3.1, currentY + 8.4);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text("WhatsQuery Purchase Order", margin + 18, currentY + 5.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Inbound procurement document prepared for supplier fulfillment", margin + 18, currentY + 10.5);

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("PURCHASE ORDER", pageWidth - margin, currentY + 8, { align: "right" });

  currentY += 25;
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("ISSUED BY", margin, currentY);
  doc.text("SUPPLIER", margin + 72, currentY);
  doc.text("PURCHASE NO.", pageWidth - margin - 52, currentY);
  doc.text("ISSUE DATE", pageWidth - margin - 20, currentY, { align: "right" });

  currentY += 6;
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.organization.name, margin, currentY);
  doc.text(data.supplier.name, margin + 72, currentY);

  doc.setFontSize(10);
  doc.text(data.invoiceNumber, pageWidth - margin - 52, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.issueDate), "MMM dd, yyyy"), pageWidth - margin, currentY, { align: "right" });

  currentY += 5;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (data.organization.email) {
    doc.text(data.organization.email, margin, currentY);
  }
  if (data.supplier.email) {
    doc.text(data.supplier.email, margin + 72, currentY);
  }
  currentY += 4;
  if (data.organization.phone) {
    doc.text(data.organization.phone, margin, currentY);
  }
  if (data.supplier.phone) {
    doc.text(data.supplier.phone, margin + 72, currentY);
  }
  currentY += 4;
  if (data.organization.address) {
    const orgLines = doc.splitTextToSize(data.organization.address, 60);
    doc.text(orgLines, margin, currentY);
    currentY += orgLines.length * 4;
  }
  if (data.supplier.address) {
    const supplierLines = doc.splitTextToSize(data.supplier.address, 60);
    doc.text(supplierLines, margin + 72, currentY - 4);
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

  const statusLabel = data.status.toUpperCase();
  const statusWidth = doc.getTextWidth(statusLabel) + 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  if (statusLabel === "PAID" || statusLabel === "APPROVED") {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(22, 163, 74);
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(249, 115, 22);
    doc.setTextColor(249, 115, 22);
  }
  doc.roundedRect(pageWidth - margin - statusWidth, currentY - 4, statusWidth, 6, 1, 1, "FD");
  doc.text(statusLabel, pageWidth - margin - statusWidth / 2, currentY, { align: "center" });
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Item Description", "Unit", "Qty", "Unit Cost", "Line Total"]],
    body: data.items.map((item) => [
      item.product.name,
      item.product.unit || "unit",
      item.quantity.toString(),
      formatMoney(item.unitCost, currency),
      formatMoney(item.total, currency),
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      cellPadding: 4,
      halign: "left",
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "right", cellWidth: 18 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 30 },
    },
    didDrawPage: (arg: any) => {
      currentY = arg.cursor.y;
    },
  });

  currentY += 12;
  const totalBoxX = pageWidth - margin - 70;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal", totalBoxX, currentY);
  doc.setTextColor(51, 65, 85);
  doc.text(formatMoney(data.subtotal, currency), pageWidth - margin, currentY, { align: "right" });

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
  doc.text("Order Total", totalBoxX, currentY);
  doc.text(formatMoney(data.totalAmount, currency), pageWidth - margin, currentY, { align: "right" });

  currentY += 18;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("PAYMENT TERMS", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(
    data.dueDate
      ? `Payment expected by ${format(new Date(data.dueDate), "MMM dd, yyyy")}.`
      : "Payment timing follows the supplier agreement and posted invoice terms.",
    margin,
    currentY,
  );

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(data.organization.name.trim(), pageWidth / 2, pageHeight - 18, { align: "center" });
  doc.text("Generated using WhatsQuery.com", pageWidth / 2, pageHeight - 13, { align: "center" });
  doc.setFontSize(7);
  doc.text("Professional purchase order generated for A4 printing and supplier sharing.", pageWidth / 2, pageHeight - 9, {
    align: "center",
  });

  return Buffer.from(doc.output("arraybuffer"));
}
