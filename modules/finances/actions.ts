"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext, requirePermission, requireRole } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";

/**
 * ACTION: CREATE FINANCIAL ACCOUNT
 */
export const createAccountAction = createServerAction({
  label: "CreateAccount",
  schema: service.accountSchema,
  roles: ["owner", "admin"],
  permissions: ["payments.manage"],
  revalidatePaths: ["/finances/accounts"],
  audit: {
    action: "create",
    entityType: "FinancialAccount",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Account ${input.name} created with balance ${input.initialBalance}`,
  },
  handler: async ({ input, context }) => {
    return service.createAccount(context.db, context.ctx.branchId, input, context.ctx.userId);
  },
});

/**
 * ACTION: EXECUTE INTER-ACCOUNT TRANSFER
 */
export const executeTransferAction = createServerAction({
  label: "ExecuteTransfer",
  schema: service.transferSchema,
  roles: ["owner", "admin"],
  permissions: ["payments.manage"],
  revalidatePaths: ["/finances/accounts"],
  audit: {
    action: "create",
    entityType: "AccountTransfer",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Transfer ${input.amount} from ${input.fromAccountId} to ${input.toAccountId}`,
  },
  handler: async ({ input, context }) => {
    return service.executeTransfer(context.db, context.ctx.branchId, input, context.ctx.userId);
  },
});

/**
 * FETCH ACTIONS
 */
export async function getAccounts() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "finances.view");
  const db = getTenantStore(ctx);
  return service.getAccounts(db);
}

export async function getAccountById(id: string) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "finances.view");
  const db = getTenantStore(ctx);
  return service.getAccountById(db, id);
}

export async function getAccountLedger(id: string) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "finances.view");
  const db = getTenantStore(ctx);
  return service.getAccountLedger(db, id);
}

export async function getUnifiedLedger() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  requirePermission(ctx, "finances.view");
  const db = getTenantStore(ctx);
  return service.getUnifiedLedger(db);
}
