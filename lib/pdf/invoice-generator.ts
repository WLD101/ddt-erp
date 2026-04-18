// lib/pdf/invoice-generator.ts
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

// Use 'any' for the autotable extension to avoid type conflicts with missing decls
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date | string;
  status: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
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

export function generateInvoicePDF(data: InvoiceData): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // 1. Header with Logo Placeholder & Org Info
  // Logo Placeholder
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.roundedRect(margin, currentY, 12, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("ERP", margin + 2.5, currentY + 7.5);

  // Org Name
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFontSize(14);
  doc.text(data.organization.name, margin + 16, currentY + 5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Gray-500
  doc.text("Professional Business Solutions", margin + 16, currentY + 10);

  // Invoice Text (Right Aligned)
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, currentY + 8, { align: "right" });
  
  currentY += 25;

  // 2. Billing & Invoice Details info
  doc.setDrawColor(241, 245, 249); // Slate-100
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Billed To Column
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text("BILLED TO", margin, currentY);

  // Details Column
  doc.text("INVOICE NUMBER", pageWidth - margin - 50, currentY);
  doc.text("ISSUE DATE", pageWidth - margin - 20, currentY, { align: "right" });

  currentY += 6;
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont("helvetica", "bold");
  doc.text(data.customer.name, margin, currentY);

  doc.setFontSize(10);
  doc.text(data.invoiceNumber, pageWidth - margin - 50, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.issueDate), "MMM dd, yyyy"), pageWidth - margin, currentY, { align: "right" });

  currentY += 5;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate-600
  if (data.customer.email) {
    doc.text(data.customer.email, margin, currentY);
    currentY += 4;
  }
  if (data.customer.phone) {
    doc.text(data.customer.phone, margin, currentY);
    currentY += 4;
  }
  if (data.customer.address) {
    const addressLines = doc.splitTextToSize(data.customer.address, 60);
    doc.text(addressLines, margin, currentY);
    currentY += (addressLines.length * 4);
  }

  currentY += 10;

  // 3. Status Badge
  const statusX = pageWidth - margin;
  const statusLabel = data.status.toUpperCase();
  const isPaid = statusLabel === "PAID";
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const statusWidth = doc.getTextWidth(statusLabel) + 6;
  
  if (isPaid) {
    doc.setFillColor(240, 253, 244); // Green-50
    doc.setDrawColor(22, 163, 74); // Green-600
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setFillColor(255, 247, 237); // Orange-50
    doc.setDrawColor(249, 115, 22); // Orange-500
    doc.setTextColor(249, 115, 22);
  }
  
  doc.roundedRect(statusX - statusWidth, currentY - 4, statusWidth, 6, 1, 1, "FD");
  doc.text(statusLabel, statusX - (statusWidth / 2), currentY, { align: "center" });
  
  currentY += 10;

  // 4. Table
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
      fillColor: [37, 99, 235], // Blue-600
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
      cellPadding: 4
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
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
  doc.setTextColor(100, 116, 139); // Slate-500
  
  // Subtotal
  doc.text("Subtotal", totalBoxX, currentY);
  doc.setTextColor(51, 65, 85);
  doc.text(`$${data.subtotal.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" });

  // Discount (only if > 0)
  if (data.discount > 0) {
    currentY += 6;
    doc.setTextColor(100, 116, 139);
    doc.text("Discount", totalBoxX, currentY);
    doc.setTextColor(220, 38, 38); // Red-600
    doc.text(`-$${data.discount.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" });
  }

  // Tax
  currentY += 6;
  doc.setTextColor(100, 116, 139);
  doc.text("Tax Amount", totalBoxX, currentY);
  doc.setTextColor(51, 65, 85);
  doc.text(`$${data.taxAmount.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" });

  // Total Divider
  currentY += 8;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.line(totalBoxX, currentY - 4, pageWidth - margin, currentY - 4);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text("Total", totalBoxX, currentY);
  doc.text(`$${data.totalAmount.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" });

  // 6. Notes
  if (data.notes) {
    currentY += 20;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.setFont("helvetica", "bold");
    doc.text("NOTES", margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // Slate-600
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - (margin * 2));
    doc.text(noteLines, margin, currentY);
  }

  // 7. Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  const footerText = "Thank you for your business. For any questions, please contact your account manager.";
  doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
