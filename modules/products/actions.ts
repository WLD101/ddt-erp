"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext, requirePermission } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { z } from "zod";
import { AnalyticCategory } from "../analytics/service";

/**
 * FETCH CATEGORIES
 */
export async function getCategories() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "products.view");
  const db = getTenantStore(ctx);
  return service.getCategories(db);
}

/**
 * CREATE CATEGORY
 */
export const createCategory = createServerAction({
  label: "CreateCategory",
  permissions: ["products.create"],
  schema: service.categorySchema,
  revalidatePaths: ["/products"],
  audit: {
    action: "CREATE_CATEGORY",
    entityType: "Category",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Established taxonomy: "${input.name}"`,
  },
  handler: async ({ input, context }) => {
    return service.createCategory(context.db, input);
  },
});

/**
 * FETCH PRODUCTS
 */
export async function getProducts() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "products.view");
  const db = getTenantStore(ctx);
  return service.getProducts(db, ctx.branchId);
}

/**
 * CREATE PRODUCT
 */
export const createProduct = createServerAction({
  label: "CreateProduct",
  permissions: ["products.create"],
  planGate: { limit: "maxProducts" },
  schema: service.productSchema,
  revalidatePaths: ["/dashboard/products", "/dashboard/inventory"],
  audit: {
    action: "CREATE_PRODUCT",
    entityType: "Product",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Cataloged product "${input.name}" [SKU: ${input.sku || "N/A"}]`,
  },
  analytics: {
    name: "PRODUCT_CREATED",
    category: AnalyticCategory.INVENTORY,
    getProperties: (input) => ({ type: input.type, hasSku: !!input.sku })
  },
  handler: async ({ input, context }) => {
    return service.createProduct(context.db, input, context.branchId);
  },
});

/**
 * UPDATE PRODUCT
 */
export const updateProduct = createServerAction({
  label: "UpdateProduct",
  permissions: ["products.edit"],
  schema: service.productSchema.partial().extend({ id: z.string() }),
  revalidatePaths: ["/dashboard/products", "/dashboard/inventory"],
  audit: {
    action: "UPDATE_PRODUCT",
    entityType: "Product",
    getEntityId: (res) => res.id,
    getDetails: (input) => `Modified specs for "${input.name || "item"}"`,
  },
  handler: async ({ input, context }) => {
    const { id, ...data } = input;
    return service.updateProduct(context.db, id, data, context.branchId);
  },
});

/**
 * DELETE PRODUCT
 */
export const deleteProduct = createServerAction({
  label: "DeleteProduct",
  blockInDemoMode: true,
  permissions: ["products.delete"],
  schema: z.object({ id: z.string() }),
  revalidatePaths: ["/dashboard/products", "/dashboard/inventory"],
  audit: {
    action: "DELETE_PRODUCT",
    entityType: "Product",
    getEntityId: (input) => input.id,
    getDetails: () => `Product purged from catalog`,
  },
  handler: async ({ input, context }) => {
    return service.deleteProduct(context.db, input.id);
  },
});
