"use server";

import { createServerAction } from "@/lib/actions/builder";
import { getTenantStore } from "@/lib/db/client";
import { getCurrentTenantContext, requirePermission } from "@/lib/tenant";
import * as service from "./service";

export async function getProductionWorkspace() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "products.view");
  const db = getTenantStore(ctx);
  return service.getProductionWorkspace(db, ctx.branchId);
}

export const saveBillOfMaterials = createServerAction({
  label: "SaveBillOfMaterials",
  permissions: ["products.edit"],
  schema: service.bomSchema,
  revalidatePaths: ["/dashboard/production", "/dashboard/products"],
  audit: {
    action: "SAVE_BOM",
    entityType: "BOM",
    getEntityId: (result) => result.id,
    getDetails: (input, result) =>
      `Saved BOM for ${result.product.name} with ${input.materials.length} material line(s)`,
  },
  handler: async ({ input, context }) => {
    return service.saveBillOfMaterials(context.db, input);
  },
});

export const createProductionOrder = createServerAction({
  label: "CreateProductionOrder",
  permissions: ["products.edit"],
  schema: service.productionOrderSchema,
  revalidatePaths: ["/dashboard/production", "/dashboard/inventory", "/dashboard/products"],
  audit: {
    action: "CREATE_PRODUCTION_ORDER",
    entityType: "WorkOrder",
    getEntityId: (result) => result.id,
    getDetails: (input, result) =>
      `Created production order for ${result.bom.product.name} with target quantity ${input.quantity}`,
  },
  handler: async ({ input, context }) => {
    return service.createProductionOrder(context.db, input);
  },
});

export const moveProductionOrderToInProgress = createServerAction({
  label: "StartProductionOrder",
  permissions: ["products.edit"],
  schema: service.productionStatusSchema.pick({ workOrderId: true }),
  revalidatePaths: ["/dashboard/production"],
  audit: {
    action: "START_PRODUCTION_ORDER",
    entityType: "WorkOrder",
    getEntityId: (result) => result.id,
    getDetails: () => "Moved production order to in-progress status",
  },
  handler: async ({ input, context }) => {
    return service.updateProductionOrderStatus(context.db, input.workOrderId, "IN_PROGRESS");
  },
});

export const completeProductionOrder = createServerAction({
  label: "CompleteProductionOrder",
  permissions: ["products.edit"],
  schema: service.productionStatusSchema.pick({ workOrderId: true }),
  revalidatePaths: ["/dashboard/production", "/dashboard/inventory", "/dashboard/products"],
  audit: {
    action: "COMPLETE_PRODUCTION_ORDER",
    entityType: "WorkOrder",
    getEntityId: (result) => result.id,
    getDetails: () => "Completed production order and posted stock movement",
  },
  handler: async ({ input, context }) => {
    return service.completeProductionOrder(context.orgId, context.branchId, input.workOrderId);
  },
});
