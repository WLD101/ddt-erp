"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext, requirePermission } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { z } from "zod";

/**
 * FETCH PURCHASE INVOICES
 */
export async function getPurchaseInvoices() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "purchases.view");
  const db = getTenantStore(ctx);
  return service.getPurchaseInvoices(db, ctx.branchId);
}

/**
 * FETCH SINGLE PURCHASE INVOICE
 */
export async function getPurchaseInvoiceById(id: string) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "purchases.view");
  const db = getTenantStore(ctx);
  return service.getPurchaseInvoiceById(db, ctx.branchId, id);
}

/**
 * CREATE PURCHASE INVOICE
 * Automatically handles inventory increments and stock movement logging.
 */
export const createPurchaseInvoice = createServerAction({
  label: "CreatePurchaseInvoice",
  permissions: ["purchases.create"],
  schema: service.purchaseInvoiceSchema,
  revalidatePaths: ["/purchases", "/inventory", "/suppliers"],
  audit: {
    action: "CREATE_PURCHASE_INVOICE",
    entityType: "PurchaseInvoice",
    getEntityId: (res) => res.id,
    getDetails: (input, res) => `Inbound Manifest ${input.invoiceNumber} — Total $${res.totalAmount.toFixed(2)}`,
  },
  handler: async ({ input, context }) => {
    return service.createPurchaseInvoice(context.db, context.branchId, input);
  },
});
