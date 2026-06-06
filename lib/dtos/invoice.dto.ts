import { z } from "zod";
import { InvoiceStatus, QuotationStatus } from "@prisma/client";

export const InvoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().min(0, "Price cannot be negative"),
  total: z.number().min(0),
});

export const CreateSalesInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.date().optional(),
  dueDate: z.date().optional().nullable(),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.DRAFT),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  notes: z.string().optional().nullable(),
  items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
});

export type CreateSalesInvoiceDto = z.infer<typeof CreateSalesInvoiceSchema>;
