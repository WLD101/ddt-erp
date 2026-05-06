/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { quantitySchema } from "@/lib/validations/common";

export const initializeSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: quantitySchema,
  location: z.string().default("Main Warehouse"),
});

export const adjustSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  adjustment: z.coerce.number(), // can be negative
  reason: z.string().min(1, "Reason is required"),
});

export type InitializeInput = z.infer<typeof initializeSchema>;
export type AdjustInput = z.infer<typeof adjustSchema>;

export async function getInventoryItems(db: ScopedPrisma, branchId: string) {
  return db.inventoryItem.findMany({
    where: { 
      branchId 
    },
    include: { 
      product: true
    },
    orderBy: { product: { name: "asc" } },
  });
}

export async function initializeInventory(
  db: ScopedPrisma, 
  branchId: string,
  data: InitializeInput
) {
  return db.$transaction(async (tx) => {
     // The scoped client ensures this only finds products in the current org
    const product = await tx.product.findUnique({
      where: { id: data.productId },
      select: { name: true }
    });

    if (!product) throw new Error("Product not found in your organization.");

    const item = await tx.inventoryItem.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        productId: data.productId,
        quantity: data.quantity,
        location: data.location || "Default",
      },
    });

    await tx.stockMovement.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        inventoryItemId: item.id,
        type: "IN",
        quantity: data.quantity,
        reason: "Initial Stock Setup",
      },
    });

    return { item, productName: product.name };
  });
}

export async function adjustStock(
  db: ScopedPrisma, 
  branchId: string,
  data: AdjustInput
) {
  return db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: data.inventoryItemId },
    });

    if (!item) throw new Error("Inventory item not found.");
    if (item.branchId !== branchId) {
      throw new Error("Inventory item does not belong to the active branch.");
    }

    // PREVENT NEGATIVE STOCK
    if (data.adjustment < 0 && item.quantity + data.adjustment < 0) {
      throw new Error(`Insufficient stock. Current: ${item.quantity}, requested deduction: ${Math.abs(data.adjustment)}`);
    }

    await tx.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: { quantity: { increment: data.adjustment } },
    });

    await tx.stockMovement.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        inventoryItemId: data.inventoryItemId,
        type: data.adjustment >= 0 ? "IN" : "OUT",
        quantity: Math.abs(data.adjustment),
        reason: data.reason,
      },
    });

    if (data.adjustment < 0) {
      const { checkLowStockForItem } = await import("../notifications/service");
      await checkLowStockForItem(tx as any, data.inventoryItemId);
    }

    return item;
  });
}
