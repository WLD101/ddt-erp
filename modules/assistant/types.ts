import { z } from "zod";

export const assistantIntentSchema = z.enum([
  "create_invoice",
  "update_inventory",
  "query_data",
  "generate_report",
  "create_customer",
  "update_customer",
  "mark_invoice_paid",
]);

export const assistantEntitySchema = z.enum([
  "invoice",
  "product",
  "customer",
  "inventory",
  "report",
]);

export const assistantActionSchema = z.enum(["create", "update", "fetch", "generate"]);

export const assistantOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const assistantOptionsSchema = z.object({
  customers: z.array(assistantOptionSchema).default([]),
  products: z.array(assistantOptionSchema).default([]),
  invoices: z.array(assistantOptionSchema).default([]),
});

export const assistantCommandSchema = z.object({
  intent: assistantIntentSchema,
  entity: assistantEntitySchema,
  action: assistantActionSchema,
  operation: z.string(),
  data: z.record(z.string(), z.any()),
  confidence: z.number().min(0).max(1),
  requiresConfirmation: z.boolean(),
  missingFields: z.array(z.string()),
  options: assistantOptionsSchema.default({
    customers: [],
    products: [],
    invoices: [],
  }),
  message: z.string(),
});

export const assistantParseResultSchema = z.object({
  success: z.boolean(),
  command: assistantCommandSchema.nullable(),
  response: z.string(),
});

export const assistantExecutionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  redirectUrl: z.string().optional(),
  result: z.record(z.string(), z.any()).optional(),
});

export type AssistantCommand = z.infer<typeof assistantCommandSchema>;
export type AssistantOption = z.infer<typeof assistantOptionSchema>;
export type AssistantParseResult = z.infer<typeof assistantParseResultSchema>;
export type AssistantExecutionResult = z.infer<typeof assistantExecutionResultSchema>;
