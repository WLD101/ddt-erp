import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema, quantitySchema, dateSchema } from "@/lib/validations/common";

export const quotationItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: quantitySchema.refine(n => n > 0, "Quantity must be at least 1"),
  unitPrice: moneySchema,
});

export const quotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  quotationNumber: z.string().min(1, "Quotation number is required"),
  date: dateSchema.default(() => new Date()),
  expiryDate: dateSchema,
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  discount: moneySchema.default(0),
  notes: z.string().nullish(),
});

export type QuotationInput = z.infer<typeof quotationSchema>;

/**
 * SERVICE: FETCH ALL QUOTATIONS
 */
export async function getQuotations(db: ScopedPrisma, branchId: string) {
  return db.quotation.findMany({
    where: { branchId },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * SERVICE: FETCH QUOTATION BY ID
 */
export async function getQuotationById(db: ScopedPrisma, branchId: string, id: string) {
  return db.quotation.findFirst({
    where: { id, branchId },
    include: { 
      customer: true, 
      items: { include: { product: true } },
      salesInvoices: true 
    },
  });
}

/**
 * SERVICE: CREATE QUOTATION (Non-binding, no stock movement)
 */
export async function createQuotation(db: ScopedPrisma, branchId: string, data: QuotationInput) {
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

    const discount = data.discount || 0;
    const totalAmount = Math.max(0, subtotal - discount);

    return tx.quotation.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        customerId: data.customerId,
        quotationNumber: data.quotationNumber,
        status: "SENT", // Default status for new quotes
        expiryDate: data.expiryDate,
        discount,
        totalAmount,
        notes: data.notes,
        items: { create: itemsToCreate },
      },
      include: { items: true },
    });
  });
}

/**
 * SERVICE: UPDATE QUOTATION STATUS
 */
export async function updateQuotationStatus(
  db: ScopedPrisma, 
  branchId: string,
  id: string, 
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CONVERTED"
) {
  const existing = await db.quotation.findFirst({
    where: { id, branchId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Quotation not found.");
  }

  return db.quotation.update({
    where: { id },
    data: { status },
  });
}

/**
 * SERVICE: CONVERT QUOTATION TO INVOICE
 */
export async function convertToInvoice(db: ScopedPrisma, branchId: string, quotationId: string) {
  const { createSalesInvoice } = await import("../sales/service");
  
  return db.$transaction(async (tx) => {
    const quotation = await tx.quotation.findFirst({
      where: { id: quotationId, branchId },
      include: { items: true },
    });

    if (!quotation) throw new Error("Quotation not found.");
    if (quotation.status === "CONVERTED") throw new Error("Quotation already converted to invoice.");

    const invoiceNumber = `INV-FROM-QT-${quotation.quotationNumber}`;

    const invoice = await createSalesInvoice(tx as any, branchId, {
      customerId: quotation.customerId,
      invoiceNumber: invoiceNumber,
      items: quotation.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      discount: quotation.discount || 0,
      notes: quotation.notes || `Generated from Quotation ${quotation.quotationNumber}`,
      quotationId: quotation.id,
    });

    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: "CONVERTED" },
    });

    return invoice;
  });
}

/**
 * SERVICE: DELETE QUOTATION
 */
export async function deleteQuotation(db: ScopedPrisma, branchId: string, id: string) {
  const existing = await db.quotation.findFirst({
    where: { id, branchId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Quotation not found.");
  }

  return db.quotation.delete({
    where: { id },
  });
}
