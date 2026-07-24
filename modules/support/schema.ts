import { z } from "zod";

export const SUPPORT_REASONS = [
  { value: "login_access", label: "Login or access issue" },
  { value: "billing_package", label: "Billing or package question" },
  { value: "invoice_sales", label: "Invoice, sales, or payment issue" },
  { value: "inventory_products", label: "Inventory or product issue" },
  { value: "reports_exports", label: "Reports, exports, or data issue" },
  { value: "integration_sync", label: "Integration or sync issue" },
  { value: "performance_bug", label: "Performance problem or bug" },
  { value: "training_help", label: "Training or how-to help" },
  { value: "other", label: "Other support request" },
] as const;

export const supportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(140, "Subject is too long"),
  reason: z.string().min(1, "Please select a reason"),
  description: z.string().min(10, "Please provide more details").max(4000, "Description is too long"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  sourcePage: z.string().max(240).optional(),
  contactName: z.string().max(120).optional(),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().max(60).optional(),
});

export const liveSupportSchema = z.object({
  message: z.string().max(1000, "Message is too long").optional(),
  sourcePage: z.string().max(240).optional(),
});

export const updateSupportRequestSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  adminNotes: z.string().max(2000).optional(),
});
