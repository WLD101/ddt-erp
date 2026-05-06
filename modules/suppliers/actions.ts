"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext, requirePermission } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { z } from "zod";

/**
 * FETCH ALL SUPPLIERS
 */
export async function getSuppliers() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "suppliers.view");
  const db = getTenantStore(ctx);
  return service.getSuppliers(db);
}

/**
 * FETCH SINGLE SUPPLIER
 */
export async function getSupplierById(id: string) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "suppliers.view");
  const db = getTenantStore(ctx);
  return service.getSupplierById(db, id);
}

/**
 * CREATE SUPPLIER
 */
export const createSupplier = createServerAction({
  label: "CreateSupplier",
  permissions: ["suppliers.create"],
  schema: service.supplierSchema,
  revalidatePaths: ["/suppliers"],
  audit: {
    action: "CREATE_SUPPLIER",
    entityType: "Supplier",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Created supplier "${input.name}"`,
  },
  handler: async ({ input, context }) => {
    return service.createSupplier(context.db, input);
  },
});

/**
 * UPDATE SUPPLIER
 */
export const updateSupplier = createServerAction({
  label: "UpdateSupplier",
  permissions: ["suppliers.edit"],
  schema: service.supplierSchema.extend({ id: z.string() }),
  revalidatePaths: ["/suppliers"],
  audit: {
    action: "UPDATE_SUPPLIER",
    entityType: "Supplier",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Updated profile for "${input.name}"`,
  },
  handler: async ({ input, context }) => {
    const { id, ...data } = input;
    return service.updateSupplier(context.db, id, data);
  },
});

/**
 * DELETE SUPPLIER
 */
export const deleteSupplier = createServerAction({
  label: "DeleteSupplier",
  blockInDemoMode: true,
  permissions: ["suppliers.delete"],
  schema: z.object({ id: z.string() }),
  revalidatePaths: ["/suppliers"],
  audit: {
    action: "DELETE_SUPPLIER",
    entityType: "Supplier",
    getEntityId: (input) => input.id,
    getDetails: () => `Supplier relationship terminated`,
  },
  handler: async ({ input, context }) => {
    return service.deleteSupplier(context.db, input.id);
  },
});
