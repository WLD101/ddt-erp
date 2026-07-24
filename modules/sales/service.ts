import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema, quantitySchema } from "@/lib/validations/common";
import { decrementInventoryOrThrow } from "@/lib/inventory/stock";

const DEFAULT_LIST_LIMIT = 500;

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
    take: DEFAULT_LIST_LIMIT,
  });
}

export async function getSalesInvoiceById(db: ScopedPrisma, branchId: string, id: string) {
  return db.salesInvoice.findFirst({
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
    // 1. Ensure Invoice Number is Unique
    const existingInvoice = await tx.salesInvoice.findFirst({
      where: { organizationId: db.organizationId, invoiceNumber: data.invoiceNumber },
      select: { id: true },
    });
    if (existingInvoice) {
      throw new Error(`Invoice number '${data.invoiceNumber}' already exists.`);
    }

    const customer = await tx.customer.findUnique({
      where: { id: data.customerId },
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

    // 2. Resolve Financial Account for Posting
    let account = await tx.financialAccount.findFirst({
      where: { organizationId: db.organizationId, isDefault: true, isActive: true },
    });

    if (!account) {
      account = await tx.financialAccount.findFirst({
        where: { organizationId: db.organizationId, isActive: true },
      });
    }

    if (!account) {
      // Auto-create safe default account for tenant
      account = await tx.financialAccount.create({
        data: {
          organizationId: db.organizationId,
          name: "Main Cash Account",
          type: "CASH",
          currentBalance: 0,
          isDefault: true,
          isActive: true,
        },
      });
    }

    // 3. Create invoice + line items
    const invoice = await tx.salesInvoice.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        status: "PAID", // Auto-marked as PAID since it's immediately posted to ledger
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

    // 3.1 If converted from quotation, update quotation status
    if (data.quotationId) {
      await tx.quotation.update({
        where: { id: data.quotationId },
        data: { status: "CONVERTED" },
      });
    }

    // 4. Record stock movements
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

    // 5. Post to Financial Ledger
    if (totalAmount > 0) {
      const updatedAccount = await tx.financialAccount.update({
        where: { id: account.id },
        data: { currentBalance: { increment: totalAmount } },
      });

      await tx.ledgerEntry.create({
        data: {
          organizationId: db.organizationId,
          branchId,
          accountId: account.id,
          amount: totalAmount,
          balanceAfter: updatedAccount.currentBalance,
          description: `Sales Invoice: ${invoice.invoiceNumber}`,
          referenceType: "PAYMENT", // Using PAYMENT to represent inflow
          referenceId: invoice.id,
        },
      });
    }

    return invoice;
  });
}

export async function updateSalesInvoiceStatus(
  db: ScopedPrisma, 
  branchId: string,
  id: string, 
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE"
) {
  const existing = await db.salesInvoice.findFirst({
    where: { id, branchId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Sales invoice not found.");
  }

  return db.salesInvoice.update({
    where: { id },
    data: { status },
  });
}
