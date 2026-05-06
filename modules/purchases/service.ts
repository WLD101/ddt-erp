/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema, quantitySchema } from "@/lib/validations/common";

export const purchaseInvoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: quantitySchema.refine(n => n > 0, "Quantity must be at least 1"),
  unitCost: moneySchema,
});

export const purchaseInvoiceSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  items: z.array(purchaseInvoiceItemSchema).min(1, "At least one item is required"),
});

export type PurchaseInvoiceInput = z.infer<typeof purchaseInvoiceSchema>;

export async function getPurchaseInvoices(db: ScopedPrisma, branchId: string) {
  return db.purchaseInvoice.findMany({
    where: { branchId },
    include: { supplier: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseInvoiceById(db: ScopedPrisma, branchId: string, id: string) {
  return db.purchaseInvoice.findUnique({
    where: { id, branchId },
    include: { 
      supplier: true, 
      items: { include: { product: true } },
      returns: { include: { items: true } }
    },
  });
}

export async function createPurchaseInvoice(db: ScopedPrisma, branchId: string, data: PurchaseInvoiceInput) {
  return db.$transaction(async (tx: any) => {
    let subtotal = 0;

    const itemsToCreate = data.items.map((item) => {
      const total = item.quantity * item.unitCost;
      subtotal += total;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        total,
      };
    });

    const taxAmount = 0;
    const totalAmount = subtotal + taxAmount;

    // 1. Create invoice + line items
    const invoice = await tx.purchaseInvoice.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
        status: "APPROVED",
        subtotal,
        taxAmount,
        totalAmount,
        items: { create: itemsToCreate },
      },
      include: { items: true },
    });

    // 2. Increment inventory and record stock movements (Branch-Specific)
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
          quantity: item.quantity,
          location: "Default",
        },
        update: { quantity: { increment: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          organizationId: tx.organizationId,
          branchId,
          inventoryItemId: inventoryItem.id,
          type: "IN",
          quantity: item.quantity,
          reason: `Purchase Invoice: ${invoice.invoiceNumber}`,
        },
      });
    }

    return invoice;
  });
}
