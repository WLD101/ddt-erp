"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { z } from "zod";

/**
 * FETCH ALL CUSTOMERS
 * Standardized query with calculated balances
 */
export async function getCustomers() {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getCustomers(db);
}

/**
 * FETCH SINGLE CUSTOMER
 */
export async function getCustomerById(id: string) {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getCustomerById(db, id);
}

/**
 * CREATE CUSTOMER
 * Wrapped in builder for automatic auth, validation, and audit logging.
 */
export const createCustomer = createServerAction({
  label: "CreateCustomer",
  permissions: ["customers.create"],
  schema: service.customerSchema,
  revalidatePaths: ["/customers"],
  audit: {
    action: "CREATE_CUSTOMER",
    entityType: "Customer",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Created customer "${input.name}"`,
  },
  handler: async ({ input, context }) => {
    return service.createCustomer(context.db, input);
  },
});

/**
 * UPDATE CUSTOMER
 */
export const updateCustomer = createServerAction({
  label: "UpdateCustomer",
  permissions: ["customers.edit"],
  schema: service.customerSchema.extend({ id: z.string() }),
  revalidatePaths: ["/customers"],
  audit: {
    action: "UPDATE_CUSTOMER",
    entityType: "Customer",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Updated profile for "${input.name}"`,
  },
  handler: async ({ input, context }) => {
    const { id, ...data } = input;
    return service.updateCustomer(context.db, id, data);
  },
});

/**
 * DELETE CUSTOMER
 */
export const deleteCustomer = createServerAction({
  label: "DeleteCustomer",
  permissions: ["customers.delete"],
  schema: z.object({ id: z.string() }),
  revalidatePaths: ["/customers"],
  audit: {
    action: "DELETE_CUSTOMER",
    entityType: "Customer",
    getEntityId: (input) => input.id,
    getDetails: () => `Customer record purged`,
  },
  handler: async ({ input, context }) => {
    return service.deleteCustomer(context.db, input.id);
  },
});
