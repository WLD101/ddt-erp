// modules/products/schema.ts
import { z } from "zod";

export const PRODUCT_UNIT_TYPES = [
  "RETAIL_QUANTITY",
  "TEXTILE_MEASUREMENT",
  "WEIGHT",
  "LENGTH",
  "VOLUME",
  "CUSTOM",
] as const;

export const PRODUCT_UNITS_BY_TYPE = {
  RETAIL_QUANTITY: ["piece", "box", "carton", "pack"],
  TEXTILE_MEASUREMENT: ["meter", "yard", "roll"],
  WEIGHT: ["kg", "gram", "lb"],
  LENGTH: ["meter", "cm", "inch", "foot"],
  VOLUME: ["liter", "ml", "gallon"],
  CUSTOM: ["custom"],
} as const;

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters."),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Price must be positive."),
  costPrice: z.coerce.number().min(0, "Cost must be positive."),
  lowStockThreshold: z.coerce.number().min(0, "Threshold must be positive.").default(10),
  openingQuantity: z.coerce.number().min(0, "Quantity must be zero or greater.").default(0),
  unitType: z.enum(PRODUCT_UNIT_TYPES).default("RETAIL_QUANTITY"),
  unit: z.string().min(1, "Unit is required."),
});

export type ProductFormValues = z.infer<typeof productSchema>;
