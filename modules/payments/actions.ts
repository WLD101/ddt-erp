"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { z } from "zod";

/**
 * FETCH PAYMENTS
 */
export async function getPayments() {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getPayments(db);
}

/**
 * CREATE PAYMENT
 * Automated marking of invoices as PAID is handled within the service transaction.
 */
export const createPayment = createServerAction({
  label: "CreatePayment",
  schema: service.paymentSchema,
  revalidatePaths: ["/finances", "/customers", "/suppliers", "/sales", "/purchases"],
  audit: {
    action: "create_payment",
    entityType: "Payment",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Processed ${input.type} payment of $${input.amount.toFixed(2)} via ${input.paymentMethod}`,
  },
  handler: async ({ input, context }) => {
    return service.createPayment(context.db, input);
  },
});

/**
 * UPDATE PAYMENT
 */
export const updatePayment = createServerAction({
  label: "UpdatePayment",
  roles: ["owner", "admin"],
  schema: service.paymentSchema.partial().extend({ id: z.string() }),
  revalidatePaths: ["/finances", "/customers", "/suppliers"],
  audit: {
    action: "update_payment",
    entityType: "Payment",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Modified payment record. New amount: $${input.amount?.toFixed(2) || "unchanged"}`,
  },
  handler: async ({ input, context }) => {
    const { id, ...data } = input;
    return service.updatePayment(context.db, id, data);
  },
});

/**
 * DELETE PAYMENT
 */
export const deletePayment = createServerAction({
  label: "DeletePayment",
  roles: ["owner", "admin"],
  schema: z.object({ id: z.string() }),
  revalidatePaths: ["/finances", "/customers", "/suppliers"],
  audit: {
    action: "delete_payment",
    entityType: "Payment",
    getEntityId: (input) => input.id,
    getDetails: () => `Vault entry retracted`,
  },
  handler: async ({ input, context }) => {
    return service.deletePayment(context.db, input.id);
  },
});
