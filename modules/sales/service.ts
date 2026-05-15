import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema, quantitySchema } from "@/lib/validations/common";
import { decrementInventoryOrThrow } from "@/lib/inventory/stock";

export const salesInvoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: quantitySchema.refine(n => n > 0, "Quantity must be at least 1"),
  unitPrice: moneySchema,
});

export const salesInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  items: z.array(salesInvoiceItemSchema).min(1, "At least one item is required"),
  discount: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional().nullable(),
  quotationId: z.string().optional().nullable(),
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
  return db.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id_organizationId: { id: data.customerId, organizationId: db.organizationId } },
      select: { id: true },
    });
    if (!customer) throw new Error("Customer not found or access denied.");

    const productIds = Array.from(new Set(data.items.map((item) => item.productId)));
    const products = await tx.product.findMany({
      where: { organizationId: db.organizationId, id: { in: productIds } },
      select: { id: true, name: true },
    });
    if (products.length !== productIds.length) {
      throw new Error("One or more products were not found in this organization.");
    }

    const requestedQuantityByProduct = new Map<string, number>();
    let subtotal = 0;

    const itemsToCreate = data.items.map((item) => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      requestedQuantityByProduct.set(
        item.productId,
        (requestedQuantityByProduct.get(item.productId) ?? 0) + item.quantity
      );
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

    const productNames = new Map(products.map((product) => [product.id, product.name]));

    const inventoryItemsByProductId = new Map<string, { id: string }>();
    for (const [productId, quantity] of requestedQuantityByProduct.entries()) {
      const inventoryItem = await decrementInventoryOrThrow(tx, {
        organizationId: db.organizationId,
        branchId,
        productId,
        quantity,
        productName: productNames.get(productId),
      });
      inventoryItemsByProductId.set(productId, { id: inventoryItem.id });
    }

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
        quotationId: data.quotationId || null,
        items: { create: itemsToCreate },
      },
      include: { items: true },
    });

    // 1.1 If converted from quotation, update quotation status
    if (data.quotationId) {
      await tx.quotation.update({
        where: { id_organizationId: { id: data.quotationId, organizationId: db.organizationId } },
        data: { status: "CONVERTED" },
      });
    }

    // 2. Record stock movements for the items already deducted in this transaction.
    for (const item of invoice.items) {
      await tx.stockMovement.create({
        data: {
          organizationId: db.organizationId,
          branchId,
          inventoryItemId: inventoryItemsByProductId.get(item.productId)!.id,
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
