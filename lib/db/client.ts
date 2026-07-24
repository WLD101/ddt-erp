import { prisma } from "@/lib/prisma";
import { scopeTenantOperationArgs } from "@/lib/security/tenant-scope";
import type { TenantContext } from "@/lib/tenant";

export function getTenantStore(ctx: TenantContext) {
  return prisma.$extends({
    name: "tenant-store",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const scopedArgs = scopeTenantOperationArgs(
            model,
            operation,
            args as Record<string, unknown>,
            ctx.organizationId,
          );

          return query(scopedArgs as typeof args);
        },
      },
    },
    client: {
      organizationId: ctx.organizationId,
    },
  });
}

export type ScopedPrisma = ReturnType<typeof getTenantStore>;
