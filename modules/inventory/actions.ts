"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { z } from "zod";
import { requirePermission } from "@/lib/tenant";

/**
 * FETCH INVENTORY ITEMS
 */
export async function getInventoryItems() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "products.view");
  const db = getTenantStore(ctx);
  return service.getInventoryItems(db, ctx.branchId);
}

/**
 * FETCH LOW STOCK ALERTS
 */
export async function getLowStockItems() {
  const items = await getInventoryItems();
  return items.filter(item => item.quantity <= item.product.lowStockThreshold);
}

/**
 * INITIALIZE STOCK
 */
export const initializeInventory = createServerAction({
  label: "InitializeInventory",
  permissions: ["products.create"],
  schema: service.initializeSchema,
  revalidatePaths: ["/inventory", "/products"],
  audit: {
    action: "INITIAL_STOCK",
    entityType: "InventoryItem",
    getEntityId: (res) => res.item.id,
  },
  handler: async ({ input, context }) => {
    return service.initializeInventory(context.db, context.branchId, input);
  },
});

/**
 * ADJUST STOCK
 */
export const adjustStock = createServerAction({
  label: "AdjustStock",
  permissions: ["products.edit"],
  schema: service.adjustSchema,
  revalidatePaths: ["/inventory", "/products"],
  audit: {
    action: "STOCK_ADJUSTMENT",
    entityType: "InventoryItem",
    getEntityId: (res) => res.id,
  },
  handler: async ({ input, context }) => {
    return service.adjustStock(context.db, context.branchId, input);
  },
});
