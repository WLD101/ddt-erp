import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { quantitySchema, moneySchema } from "@/lib/validations/common";
import { writeAuditLog } from "@/lib/audit";

export const returnItemSchema = z.object({
  productId: z.string(),
  quantity: quantitySchema.refine(n => n > 0, "Quantity must be at least 1"),
  priceAtReturn: moneySchema, 
});

export const salesReturnSchema = z.object({
  salesInvoiceId: z.string(),
  reason: z.string().optional(),
  items: z.array(returnItemSchema).min(1, "At least one item must be returned"),
});

export const purchaseReturnSchema = z.object({
  purchaseInvoiceId: z.string(),
  reason: z.string().optional(),
  items: z.array(returnItemSchema).min(1, "At least one item must be returned"),
});

export type SalesReturnInput = z.infer<typeof salesReturnSchema>;
export type PurchaseReturnInput = z.infer<typeof purchaseReturnSchema>;

/**
 * SERVICE: PROCESS SALES RETURN (CUSTOMER -> ERP)
 */
export async function createSalesReturn(db: ScopedPrisma, branchId: string, data: SalesReturnInput, userId: string) {
  return db.$transaction(async (tx: any) => {
    // 1. Fetch Invoice with existing returns to calculate cumulative limits
    const invoice = await tx.salesInvoice.findUnique({
      where: { id: data.salesInvoiceId },
      include: { 
        items: true,
        returns: {
          include: { items: true }
        }
      },
    });

    if (!invoice) throw new Error("Original sales invoice not found.");
    if (invoice.branchId !== branchId) throw new Error("Security Violation: Branch mismatch.");

    let subtotal = 0;
    const itemsToCreate = data.items.map(item => {
      const originalLine = invoice.items.find(i => i.productId === item.productId);
      if (!originalLine) throw new Error(`Product not found in original sale.`);

      // Calculate total already returned for this product
      const alreadyReturned = invoice.returns.reduce((sum, ret) => {
        const retItem = ret.items.find(ri => ri.productId === item.productId);
        return sum + (retItem?.quantity || 0);
      }, 0);

      const remaining = originalLine.quantity - alreadyReturned;
      if (item.quantity > remaining) {
        throw new Error(`Maximum returnable for ${originalLine.productId} is ${remaining} units (Already returned: ${alreadyReturned}).`);
      }

      const itemTotal = item.quantity * item.priceAtReturn;
      subtotal += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.priceAtReturn,
        total: itemTotal,
      };
    });

    const taxAmount = 0; // Simplified for now
    const totalAmount = subtotal + taxAmount;

    // 2. Create the Return Record
    const ret = await tx.salesReturn.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        salesInvoiceId: data.salesInvoiceId,
        returnNumber: `SR-${Date.now().toString().slice(-8)}`,
        reason: data.reason,
        subtotal,
        taxAmount,
        totalAmount,
        items: { create: itemsToCreate },
      },
    });

    // 3. Update Invoice Status
    // Calculate new status: If all items returned -> RETURNED, else PARTIAL_RETURNED
    const allItemsTotalQuantity = invoice.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalReturnedSoFar = invoice.returns.reduce((sum, r) => 
      sum + r.items.reduce((isum, ii) => isum + ii.quantity, 0), 0
    ) + data.items.reduce((sum, i) => sum + i.quantity, 0);

    const newStatus = totalReturnedSoFar >= allItemsTotalQuantity ? "RETURNED" : "PARTIAL_RETURNED";
    await tx.salesInvoice.update({
      where: { id: invoice.id },
      data: { status: newStatus }
    });

    // 4. Stock Reconciliation (Increment Inventories)
    for (const item of data.items) {
      const invItem = await tx.inventoryItem.upsert({
        where: {
          organizationId_branchId_productId: {
            organizationId: db.organizationId,
            branchId,
            productId: item.productId,
          }
        },
        create: {
          organizationId: db.organizationId,
          branchId,
          productId: item.productId,
          quantity: item.quantity,
          location: "Restocking Area",
        },
        update: { quantity: { increment: item.quantity } }
      });

      await tx.stockMovement.create({
        data: {
          organizationId: db.organizationId,
          branchId,
          inventoryItemId: invItem.id,
          type: "IN",
          quantity: item.quantity,
          reason: `SALE_RETURN_IN: ${ret.returnNumber}`,
        }
      });
    }

    // 5. Audit Logging
    await writeAuditLog(
      { organizationId: db.organizationId, user: { id: userId } } as any,
      "process_return",
      "SalesReturn",
      ret.id,
      `Processed return ${ret.returnNumber} for Invoice ${invoice.invoiceNumber}. Total reversal: $${totalAmount}.`
    );

    return ret;
  });
}

/**
 * SERVICE: PROCESS PURCHASE RETURN (ERP -> SUPPLIER)
 */
export async function createPurchaseReturn(db: ScopedPrisma, branchId: string, data: PurchaseReturnInput, userId: string) {
  return db.$transaction(async (tx: any) => {
    const invoice = await tx.purchaseInvoice.findUnique({
      where: { id: data.purchaseInvoiceId },
      include: { 
        items: true,
        returns: { include: { items: true } }
      },
    });

    if (!invoice) throw new Error("Original purchase invoice not found.");
    if (invoice.branchId !== branchId) throw new Error("Security Violation: Branch mismatch.");

    let subtotal = 0;
    const itemsToCreate = data.items.map(item => {
      const originalLine = invoice.items.find(i => i.productId === item.productId);
      if (!originalLine) throw new Error(`Product not found in original purchase.`);

      const alreadyReturned = invoice.returns.reduce((sum, ret) => {
        const retItem = ret.items.find(ri => ri.productId === item.productId);
        return sum + (retItem?.quantity || 0);
      }, 0);

      const remaining = originalLine.quantity - alreadyReturned;
      if (item.quantity > remaining) {
        throw new Error(`Maximum returnable for ${originalLine.productId} is ${remaining} units.`);
      }

      const itemTotal = item.quantity * item.priceAtReturn;
      subtotal += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.priceAtReturn,
        total: itemTotal,
      };
    });

    const totalAmount = subtotal;

    const ret = await tx.purchaseReturn.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        purchaseInvoiceId: data.purchaseInvoiceId,
        returnNumber: `PR-${Date.now().toString().slice(-8)}`,
        reason: data.reason,
        subtotal,
        totalAmount,
        items: { create: itemsToCreate },
      },
    });

    // Update Parent Status
    const allItemsTotalQuantity = invoice.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalReturnedSoFar = invoice.returns.reduce((sum, r) => 
      sum + r.items.reduce((isum, ii) => isum + ii.quantity, 0), 0
    ) + data.items.reduce((sum, i) => sum + i.quantity, 0);

    const newStatus = totalReturnedSoFar >= allItemsTotalQuantity ? "RETURNED" : "PARTIAL_RETURNED";
    await tx.purchaseInvoice.update({
      where: { id: invoice.id },
      data: { status: newStatus }
    });

    // Stock Reconciliation (Decrement)
    for (const item of data.items) {
      const invItem = await tx.inventoryItem.findUnique({
        where: {
          organizationId_branchId_productId: {
            organizationId: db.organizationId,
            branchId,
            productId: item.productId,
          }
        }
      });

      if (!invItem || invItem.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productId} to fulfill purchase return.`);
      }

      await tx.inventoryItem.update({
        where: { id: invItem.id },
        data: { quantity: { decrement: item.quantity } }
      });

      await tx.stockMovement.create({
        data: {
          organizationId: db.organizationId,
          branchId,
          inventoryItemId: invItem.id,
          type: "OUT",
          quantity: item.quantity,
          reason: `PURCHASE_RETURN_OUT: ${ret.returnNumber}`,
        }
      });
    }

    // Audit Logging
    await writeAuditLog(
      { organizationId: db.organizationId, user: { id: userId } } as any,
      "process_return",
      "PurchaseReturn",
      ret.id,
      `Processed purchase return ${ret.returnNumber} for Invoice ${invoice.invoiceNumber}.`
    );

    return ret;
  });
}

export async function getSalesReturns(db: ScopedPrisma, branchId: string) {
  return db.salesReturn.findMany({
    where: { branchId },
    include: { 
      salesInvoice: { include: { customer: true } }, 
      items: { include: { product: true } } 
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseReturns(db: ScopedPrisma, branchId: string) {
  return db.purchaseReturn.findMany({
    where: { branchId },
    include: { 
      purchaseInvoice: { include: { supplier: true } }, 
      items: { include: { product: true } } 
    },
    orderBy: { createdAt: "desc" },
  });
}
