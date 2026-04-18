"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";

/**
 * ACTION: CREATE FINANCIAL ACCOUNT
 */
export const createAccountAction = createServerAction({
  label: "CreateAccount",
  schema: service.accountSchema,
  permissions: ["finances.view"], // Using finances.view base for now, can be narrowed
  revalidatePaths: ["/finances/accounts"],
  audit: {
    action: "create",
    entityType: "FinancialAccount",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Account ${input.name} created with balance ${input.initialBalance}`,
  },
  handler: async ({ input, context }) => {
    return service.createAccount(context.db, context.ctx.branchId, input, context.ctx.user.id);
  },
});

/**
 * ACTION: EXECUTE INTER-ACCOUNT TRANSFER
 */
export const executeTransferAction = createServerAction({
  label: "ExecuteTransfer",
  schema: service.transferSchema,
  revalidatePaths: ["/finances/accounts"],
  audit: {
    action: "create",
    entityType: "AccountTransfer",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Transfer ${input.amount} from ${input.fromAccountId} to ${input.toAccountId}`,
  },
  handler: async ({ input, context }) => {
    return service.executeTransfer(context.db, context.ctx.branchId, input, context.ctx.user.id);
  },
});

/**
 * FETCH ACTIONS
 */
export async function getAccounts() {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getAccounts(db);
}

export async function getAccountById(id: string) {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getAccountById(db, id);
}

export async function getAccountLedger(id: string) {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getAccountLedger(db, id);
}
