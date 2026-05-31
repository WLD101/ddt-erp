"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext, requirePermission } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { z } from "zod";
import { AnalyticCategory } from "../analytics/service";

/**
 * FETCH SALES INVOICES
 */
export async function getSalesInvoices() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "sales.view");
  const db = getTenantStore(ctx);
  return service.getSalesInvoices(db, ctx.branchId);
}

/**
 * FETCH SINGLE INVOICE
 */
export async function getSalesInvoiceById(id: string) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "sales.view");
  const db = getTenantStore(ctx);
  return service.getSalesInvoiceById(db, ctx.branchId, id);
}

/**
 * CREATE SALES INVOICE
 * Triggers automatic inventory decrement and stock movement logs.
 */
export const createSalesInvoice = createServerAction({
  label: "CreateSalesInvoice",
  permissions: ["sales.create"],
  planGate: { limit: "maxMonthlyInvoices" },
  schema: service.salesInvoiceSchema,
  revalidatePaths: ["/sales", "/inventory", "/customers"],
  audit: {
    action: "CREATE_SALES_INVOICE",
    entityType: "SalesInvoice",
    getEntityId: (res) => res.id,
    getDetails: (input, res) => `Invoice ${input.invoiceNumber} — Total $${res.totalAmount.toFixed(2)}`,
  },
  analytics: {
    name: "SALE_CREATED",
    category: AnalyticCategory.SALES,
    getProperties: (input, res) => ({ amount: res.totalAmount, itemCount: input.items.length })
  },
  handler: async ({ input, context }) => {
    return service.createSalesInvoice(context.db, context.branchId, input);
  },
});

/**
 * UPDATE INVOICE STATUS
 */
export const updateSalesInvoiceStatus = createServerAction({
  label: "UpdateSalesInvoiceStatus",
  permissions: ["sales.edit"],
  schema: z.object({
    id: z.string(),
    status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]),
  }),
  revalidatePaths: ["/sales"],
  audit: {
    action: "UPDATE_SALES_INVOICE_STATUS",
    entityType: "SalesInvoice",
    getEntityId: (input) => input.id,
    getDetails: (input) => `Status transition to ${input.status}`,
  },
  handler: async ({ input, context }) => {
    return service.updateSalesInvoiceStatus(context.db, context.branchId, input.id, input.status);
  },
});
