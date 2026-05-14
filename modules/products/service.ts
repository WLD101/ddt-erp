/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema } from "@/lib/validations/common";
import { productSchema as formProductSchema } from "./schema";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const productSchema = formProductSchema.extend({
  name: z.string().min(1, "Name is required"),
  unitPrice: moneySchema,
  costPrice: moneySchema,
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  openingQuantity: z.coerce.number().min(0).default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;

// --- Categories ---

export async function getCategories(db: ScopedPrisma) {
  return db.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createCategory(db: ScopedPrisma, data: CategoryInput) {
  return db.category.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
  });
}

// --- Products ---

export async function getProducts(db: ScopedPrisma, branchId: string) {
  return db.product.findMany({
    include: {
      category: true,
      inventoryItems: {
        where: { branchId },
        select: { quantity: true, location: true, branchId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(db: ScopedPrisma, data: ProductInput, branchId: string) {
  return db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        sku: data.sku || null,
        categoryId: data.categoryId || null,
        unitPrice: data.unitPrice,
        costPrice: data.costPrice,
        lowStockThreshold: data.lowStockThreshold,
        unit: data.unit,
        unitType: data.unitType,
      },
    });

    if (data.openingQuantity > 0) {
      const inventoryItem = await tx.inventoryItem.upsert({
        where: {
          organizationId_branchId_productId: {
            organizationId: db.organizationId,
            branchId,
            productId: product.id,
          },
        },
        create: {
          organizationId: db.organizationId,
          branchId,
          productId: product.id,
          quantity: data.openingQuantity,
        },
        update: {
          quantity: data.openingQuantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId: db.organizationId,
          branchId,
          inventoryItemId: inventoryItem.id,
          type: "IN",
          quantity: data.openingQuantity,
          reason: "Opening stock configured from product form",
        },
      });
    }

    return product;
  });
}

export async function updateProduct(db: ScopedPrisma, id: string, data: Partial<ProductInput>, branchId: string) {
  return db.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        unitPrice: data.unitPrice,
        costPrice: data.costPrice,
        lowStockThreshold: data.lowStockThreshold,
        unit: data.unit,
        unitType: data.unitType,
      },
    });

    if (typeof data.openingQuantity === "number") {
      const existingInventory = await tx.inventoryItem.findUnique({
        where: {
          organizationId_branchId_productId: {
            organizationId: db.organizationId,
            branchId,
            productId: id,
          },
        },
      });

      const previousQuantity = existingInventory?.quantity ?? 0;
      const nextQuantity = data.openingQuantity;
      const quantityDelta = nextQuantity - previousQuantity;

      const inventoryItem = await tx.inventoryItem.upsert({
        where: {
          organizationId_branchId_productId: {
            organizationId: db.organizationId,
            branchId,
            productId: id,
          },
        },
        create: {
          organizationId: db.organizationId,
          branchId,
          productId: id,
          quantity: nextQuantity,
        },
        update: {
          quantity: nextQuantity,
        },
      });

      if (quantityDelta !== 0) {
        await tx.stockMovement.create({
          data: {
            organizationId: db.organizationId,
            branchId,
            inventoryItemId: inventoryItem.id,
            type: quantityDelta > 0 ? "IN" : "OUT",
            quantity: Math.abs(quantityDelta),
            reason: "Stock level updated from product form",
          },
        });
      }
    }

    return product;
  });
}

export async function deleteProduct(db: ScopedPrisma, id: string) {
  return db.product.delete({
    where: { id },
  });
}
