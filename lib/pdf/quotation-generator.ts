// lib/pdf/quotation-generator.ts
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

// Use 'any' for the autotable extension to avoid type conflicts with missing decls
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface QuotationData {
  quotationNumber: string;
  issueDate: Date | string;
  expiryDate: Date | string;
  status: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  notes?: string | null;
  organization: {
    name: string;
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
  let currentY = 20;

  // 1. Header
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.roundedRect(margin, currentY, 12, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("QT", margin + 3.5, currentY + 7.5);

  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFontSize(14);
  doc.text(data.organization.name, margin + 16, currentY + 5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Official Commercial Proposal", margin + 16, currentY + 10);

  doc.setTextColor(79, 70, 229);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pageWidth - margin, currentY + 8, { align: "right" });
  
  currentY += 25;

  // 2. Billing & Expiry Details
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("PROPOSAL FOR", margin, currentY);
  doc.text("QUOTE NUMBER", pageWidth - margin - 55, currentY);
  doc.text("ISSUE DATE", pageWidth - margin - 25, currentY, { align: "right" });
  doc.text("VALID UNTIL", pageWidth - margin, currentY, { align: "right" });

  currentY += 6;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.customer.name, margin, currentY);
  doc.text(data.quotationNumber, pageWidth - margin - 55, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.issueDate), "MMM dd, yyyy"), pageWidth - margin - 25, currentY, { align: "right" });
  doc.text(format(new Date(data.expiryDate), "MMM dd, yyyy"), pageWidth - margin, currentY, { align: "right" });

  currentY += 15;

  // 3. Table
  const tableRows = data.items.map((item) => [
    item.product.name,
    item.quantity.toString(),
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.total.toFixed(2)}`,
  ]);

  doc.autoTable({
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Item Description", "Qty", "Unit Price", "Total"]],
    body: tableRows,
    theme: "plain",
    headStyles: { 
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 4. Totals
  const totalBoxX = pageWidth - margin - 60;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal", totalBoxX, currentY);
  doc.setTextColor(51, 65, 85);
  doc.text(`$${data.subtotal.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" });

  if (data.discount > 0) {
    currentY += 6;
    doc.setTextColor(100, 116, 139);
    doc.text("Discount", totalBoxX, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`-$${data.discount.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" });
  }

  currentY += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Estimate Total", totalBoxX, currentY);
  doc.text(`$${data.totalAmount.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" });

  // 5. Notes & T&C
  if (data.notes) {
    currentY += 20;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("TERMS & CONDITIONS", margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - (margin * 2));
    doc.text(noteLines, margin, currentY);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
