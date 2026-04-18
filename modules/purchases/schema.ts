import { z } from "zod";

export const purchaseInvoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0, "Cost must be a positive number"),
});

export const purchaseInvoiceSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  items: z.array(purchaseInvoiceItemSchema).min(1, "At least one item is required"),
});

export type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceSchema>;
