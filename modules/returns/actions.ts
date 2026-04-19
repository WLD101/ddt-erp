"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";

/**
 * ACTION: PROCESS SALES RETURN
 */
export const createSalesReturnAction = createServerAction({
  label: "CreateSalesReturn",
  schema: service.salesReturnSchema,
  permissions: ["sales.return"],
  revalidatePaths: ["/sales", "/inventory"],
  audit: {
    action: "create",
    entityType: "SalesReturn",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Processed sales return for invoice ${input.salesInvoiceId}`,
  },
  handler: async ({ input, context }) => {
    return service.createSalesReturn(
      context.db, 
      context.ctx.branchId, 
      input, 
      context.ctx.userId
    );
  },
});

/**
 * ACTION: PROCESS PURCHASE RETURN
 */
export const createPurchaseReturnAction = createServerAction({
  label: "CreatePurchaseReturn",
  schema: service.purchaseReturnSchema,
  permissions: ["purchases.return"],
  revalidatePaths: ["/purchases", "/inventory"],
  audit: {
    action: "create",
    entityType: "PurchaseReturn",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Processed purchase return for invoice ${input.purchaseInvoiceId}`,
  },
  handler: async ({ input, context }) => {
    return service.createPurchaseReturn(
      context.db, 
      context.ctx.branchId, 
      input, 
      context.ctx.userId
    );
  },
});

/**
 * FETCH ACTIONS
 */
export async function getSalesReturns() {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getSalesReturns(db, ctx.branchId);
}

export async function getPurchaseReturns() {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getPurchaseReturns(db, ctx.branchId);
}
