import { z } from "zod";

export const salesInvoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Price must be a positive number"),
});

export const salesInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  items: z.array(salesInvoiceItemSchema).min(1, "At least one item is required"),
  discount: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

export type SalesInvoiceFormValues = z.infer<typeof salesInvoiceSchema>;
