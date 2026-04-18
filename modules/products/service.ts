import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema } from "@/lib/validations/common";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  unitPrice: moneySchema,
  costPrice: moneySchema,
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
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

export async function getProducts(db: ScopedPrisma) {
  return db.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(db: ScopedPrisma, data: ProductInput) {
  return db.product.create({
    data: {
      name: data.name,
      sku: data.sku || null,
      categoryId: data.categoryId || null,
      unitPrice: data.unitPrice,
      costPrice: data.costPrice,
      lowStockThreshold: data.lowStockThreshold,
    },
  });
}

export async function updateProduct(db: ScopedPrisma, id: string, data: Partial<ProductInput>) {
  return db.product.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId,
      unitPrice: data.unitPrice,
      costPrice: data.costPrice,
      lowStockThreshold: data.lowStockThreshold,
    },
  });
}

export async function deleteProduct(db: ScopedPrisma, id: string) {
  return db.product.delete({
    where: { id },
  });
}
