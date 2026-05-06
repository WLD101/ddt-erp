/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { z } from "zod";

/**
 * FETCH EXPENSES
 */
export async function getExpenses() {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getExpenses(db);
}

/**
 * CREATE EXPENSE
 */
export const createExpense = createServerAction({
  label: "CreateExpense",
  schema: service.expenseSchema,
  revalidatePaths: ["/finances"],
  audit: {
    action: "create_expense",
    entityType: "Expense",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Logged expense: "${input.description}" - $${input.amount.toFixed(2)}`,
  },
  handler: async ({ input, context }) => {
    return service.createExpense(context.db, input);
  },
});

/**
 * UPDATE EXPENSE
 */
export const updateExpense = createServerAction({
  label: "UpdateExpense",
  roles: ["owner", "admin"],
  schema: service.expenseSchema.partial().extend({ id: z.string() }),
  revalidatePaths: ["/finances"],
  audit: {
    action: "update_expense",
    entityType: "Expense",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Adjusted expense entry: "${input.description || "item"}"`,
  },
  handler: async ({ input, context }) => {
    const { id, ...data } = input;
    return service.updateExpense(context.db, id, data);
  },
});

/**
 * DELETE EXPENSE
 */
export const deleteExpense = createServerAction({
  label: "DeleteExpense",
  blockInDemoMode: true,
  roles: ["owner", "admin"],
  schema: z.object({ id: z.string() }),
  revalidatePaths: ["/finances"],
  audit: {
    action: "delete_expense",
    entityType: "Expense",
    getEntityId: (input) => input.id,
    getDetails: () => `Expense record purged`,
  },
  handler: async ({ input, context }) => {
    return service.deleteExpense(context.db, input.id);
  },
});
