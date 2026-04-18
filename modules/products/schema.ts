// modules/products/schema.ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters."),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Price must be positive."),
  costPrice: z.coerce.number().min(0, "Cost must be positive."),
  lowStockThreshold: z.coerce.number().min(0, "Threshold must be positive.").default(10),
});

export type ProductFormValues = z.infer<typeof productSchema>;
