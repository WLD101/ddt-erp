import { z } from "zod";

export const paymentSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().optional(),
  
  // Relations
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  salesInvoiceId: z.string().optional(),
  purchaseInvoiceId: z.string().optional(),
}).refine(data => {
  // Must provide at least a customer or supplier
  return data.customerId || data.supplierId;
}, {
  message: "Either Customer or Supplier must be selected",
  path: ["customerId"],
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
