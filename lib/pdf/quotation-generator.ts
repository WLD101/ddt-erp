import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatMoney } from "./document-utils";

export interface QuotationData {
  quotationNumber: string;
  issueDate: Date | string;
  expiryDate?: Date | string | null;
  status: string;
  subtotal: number;
  discount: number;
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

export function generateQuotationPDF(data: QuotationData): Buffer {
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
  doc.text("WhatsQuery Quotation", margin + 18, currentY + 5.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Commercial proposal prepared for customer approval", margin + 18, currentY + 10.5);

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pageWidth - margin, currentY + 8, { align: "right" });

  currentY += 25;

  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("PREPARED FOR", margin, currentY);
  doc.text("BUSINESS", margin + 70, currentY);
  doc.text("QUOTE NUMBER", pageWidth - margin - 50, currentY);
  doc.text("ISSUE DATE", pageWidth - margin - 20, currentY, { align: "right" });

  currentY += 6;
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.customer.name, margin, currentY);
  doc.text(data.organization.name, margin + 70, currentY);

  doc.setFontSize(10);
  doc.text(data.quotationNumber, pageWidth - margin - 50, currentY);
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
    const customerAddressLines = doc.splitTextToSize(data.customer.address, 60);
    doc.text(customerAddressLines, margin, currentY);
    currentY += customerAddressLines.length * 4;
  }
  if (data.organization.address) {
    const businessAddressLines = doc.splitTextToSize(data.organization.address, 60);
    doc.text(businessAddressLines, margin + 70, currentY - 4);
  }

  if (data.expiryDate) {
    const expiryY = currentY - 4;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("VALID UNTIL", pageWidth - margin - 20, expiryY);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(format(new Date(data.expiryDate), "MMM dd, yyyy"), pageWidth - margin, expiryY + 4, { align: "right" });
  }

  currentY += 12;

  const statusX = pageWidth - margin;
  const statusLabel = data.status.toUpperCase();
  const isAccepted = statusLabel === "ACCEPTED" || statusLabel === "CONVERTED";

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const statusWidth = doc.getTextWidth(statusLabel) + 6;

  if (isAccepted) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(22, 163, 74);
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(37, 99, 235);
    doc.setTextColor(37, 99, 235);
  }

  doc.roundedRect(statusX - statusWidth, currentY - 4, statusWidth, 6, 1, 1, "FD");
  doc.text(statusLabel, statusX - statusWidth / 2, currentY, { align: "center" });
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Item Description", "Unit", "Qty", "Unit Rate", "Line Total"]],
    body: data.items.map((item) => [
      item.product.name,
      item.product.unit || "unit",
      item.quantity.toString(),
      formatMoney(item.unitPrice, currency),
      formatMoney(item.total, currency),
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
      cellPadding: 4,
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
      textColor: [51, 65, 85],
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

  if (data.discount > 0) {
    currentY += 6;
    doc.setTextColor(100, 116, 139);
    doc.text("Discount", totalBoxX, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatMoney(data.discount, currency)}`, pageWidth - margin, currentY, { align: "right" });
  }

  currentY += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(totalBoxX, currentY - 4, pageWidth - margin, currentY - 4);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Estimate Total", totalBoxX, currentY);
  doc.text(formatMoney(data.totalAmount, currency), pageWidth - margin, currentY, { align: "right" });

  if (data.notes) {
    currentY += 20;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT TERMS / NOTES", margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, currentY);
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(data.organization.name.trim(), pageWidth / 2, pageHeight - 18, { align: "center" });
  doc.text("Generated using WhatsQuery.com", pageWidth / 2, pageHeight - 13, { align: "center" });
  doc.setFontSize(7);
  doc.text("Professional quotation generated for A4 printing and digital sharing.", pageWidth / 2, pageHeight - 9, {
    align: "center",
  });

  return Buffer.from(doc.output("arraybuffer"));
}
