import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema, quantitySchema } from "@/lib/validations/common";

export const salesInvoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: quantitySchema.refine(n => n > 0, "Quantity must be at least 1"),
  unitPrice: moneySchema,
});

export const salesInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  items: z.array(salesInvoiceItemSchema).min(1, "At least one item is required"),
  discount: moneySchema,
  notes: z.string().nullish(),
  quotationId: z.string().nullish(),
});

export type SalesInvoiceInput = z.infer<typeof salesInvoiceSchema>;

export async function getSalesInvoices(db: ScopedPrisma, branchId: string) {
  return db.salesInvoice.findMany({
    where: { branchId },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSalesInvoiceById(db: ScopedPrisma, branchId: string, id: string) {
  return db.salesInvoice.findUnique({
    where: { id, branchId },
    include: { 
      customer: true, 
      items: { include: { product: true } },
      returns: { include: { items: true } }
    },
  });
}

export async function createSalesInvoice(db: ScopedPrisma, branchId: string, data: SalesInvoiceInput) {
  return db.$transaction(async (tx: any) => {
    let subtotal = 0;

    const itemsToCreate = data.items.map((item) => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total,
      };
    });

    const taxAmount = 0;
    const discount = data.discount || 0;
    const totalAmount = Math.max(0, subtotal - discount + taxAmount);

    // 1. Create invoice + line items
    const invoice = await tx.salesInvoice.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        status: "SENT",
        subtotal,
        discount,
        taxAmount,
        totalAmount,
        notes: data.notes,
        quotationId: data.quotationId,
        items: { create: itemsToCreate },
      },
      include: { items: true },
    });

    // 1.1 If converted from quotation, update quotation status
    if (data.quotationId) {
      await tx.quotation.update({
        where: { id: data.quotationId },
        data: { status: "CONVERTED" },
      });
    }

    // 2. Decrement inventory and record stock movements (Branch-Specific)
    for (const item of invoice.items) {
      const inventoryItem = await tx.inventoryItem.upsert({
        where: {
          organizationId_branchId_productId: {
            organizationId: tx.organizationId,
            branchId,
            productId: item.productId,
          },
        },
        create: {
          organizationId: tx.organizationId,
          branchId,
          productId: item.productId,
          quantity: -item.quantity,
          location: "Default",
        },
        update: { quantity: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          organizationId: tx.organizationId,
          branchId,
          inventoryItemId: inventoryItem.id,
          type: "OUT",
          quantity: item.quantity,
          reason: `Sales Invoice: ${invoice.invoiceNumber}`,
        },
      });
    }

    return invoice;
  });
}

export async function updateSalesInvoiceStatus(
  db: ScopedPrisma, 
  id: string, 
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE"
) {
  return db.salesInvoice.update({
    where: { id },
    data: { status },
  });
}
