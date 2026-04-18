import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/tenant";

/**
 * MODELS WITH ORGANIZATION_ID
 * These models are strictly partitioned by tenant.
 */
const TENANT_MODELS = [
  "Invitation",
  "OrganizationUser",
  "Subscription",
  "Customer",
  "Supplier",
  "Category",
  "Product",
  "InventoryItem",
  "StockMovement",
  "SalesInvoice",
  "PurchaseInvoice",
  "Expense",
  "Payment",
  "AuditLog",
];

/**
 * Creates a Prisma client extension scoped to a specific tenant context.
 * 
 * Features:
 * 1. Automatic "where" injection for read/update/delete operations.
 * 2. Automatic "data" injection for create operations.
 * 3. Fail-safe isolation: Developers don't need to remember to filter by organizationId.
 * 
 * @param ctx The validated tenant context from getCurrentTenantContext()
 */
export function getTenantStore(ctx: TenantContext) {
  const orgId = ctx.organizationId;
  
  return prisma.$extends({
    result: {
      $allModels: {
        // This is a dummy field to make the organizationId accessible on the client instance itself
        // Note: result extensions apply to models, not the client. 
      }
    },
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Only apply to models that explicitly hold a tenant reference
          if (!TENANT_MODELS.includes(model)) {
            return query(args);
          }

          // ── READ / UPDATE / DELETE OPERATIONS ──────────────────────────────────
          if ([
            "findMany", 
            "findUnique", 
            "findFirst", 
            "update", 
            "updateMany", 
            "delete", 
            "deleteMany", 
            "count", 
            "aggregate", 
            "groupBy",
            "upsert"
          ].includes(operation)) {
            // Ensure args.where exists and contains organizationId
            args.where = { 
              ...(args.where || {}), 
              organizationId: orgId 
            };
          }

          // ── CREATE OPERATIONS ──────────────────────────────────────────────────
          if (operation === "create") {
            args.data = { 
              ...(args.data || {}), 
              organizationId: orgId 
            };
          }

          if (operation === "createMany") {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({
                ...item,
                organizationId: orgId
              }));
            }
          }

          // ── UPSERT SPECIFICS ──────────────────────────────────────────────────
          if (operation === "upsert") {
            args.create = {
              ...(args.create || {}),
              organizationId: orgId
            };
          }

          return query(args);
        },
      },
    },
  }).$extends({
    // We use a second extension stage to attach the organizationId to the client itself
    client: {
      organizationId: orgId
    }
  });
}

/**
 * Type-safe helper for operations that only need the current org ID.
 */
export type ScopedPrisma = ReturnType<typeof getTenantStore>;
