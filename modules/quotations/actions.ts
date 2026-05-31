/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext, requirePermission } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";

/**
 * ACTION: CREATE QUOTATION
 */
export const createQuotationAction = createServerAction({
  label: "CreateQuotation",
  schema: service.quotationSchema,
  permissions: ["sales.create"],
  revalidatePaths: ["/sales/quotes"],
  audit: {
    action: "create",
    entityType: "Quotation",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Quotation ${input.quotationNumber} created for customer ${input.customerId}`,
  },
  handler: async ({ input, context }) => {
    return service.createQuotation(context.db, context.ctx.branchId, input);
  },
});

/**
 * ACTION: UPDATE STATUS
 */
export const updateQuotationStatusAction = createServerAction({
  label: "UpdateQuotationStatus",
  schema: service.quotationSchema.partial(), // Simplified for status only usually, but let's be explicit if needed
  permissions: ["sales.edit"],
  revalidatePaths: ["/sales/quotes"],
  handler: async ({ input, context }) => {
    // Note: This expects a specific status update logic, usually done via a specialized action
    // but for now we follow the builder pattern.
    return null; 
  },
});

/**
 * ACTION: DELETE QUOTATION
 */
export const deleteQuotationAction = createServerAction({
  label: "DeleteQuotation",
  blockInDemoMode: true,
  permissions: ["sales.delete"],
  revalidatePaths: ["/sales/quotes"],
  audit: {
    action: "delete",
    entityType: "Quotation",
    getDetails: (id) => `Deleted quotation ${id}`,
  },
  handler: async ({ input, context }) => {
    // input is the ID here based on common builder usage for deletes
    return service.deleteQuotation(context.db, context.ctx.branchId, input as string);
  },
});

/**
 * FETCH ACTIONS
 */
export async function getQuotations() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "sales.view");
  const db = getTenantStore(ctx);
  return service.getQuotations(db, ctx.branchId);
}

export async function getQuotationById(id: string) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "sales.view");
  const db = getTenantStore(ctx);
  return service.getQuotationById(db, ctx.branchId, id);
}
