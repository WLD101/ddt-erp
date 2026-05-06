import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenantContext, TenantForbiddenError } from "@/lib/tenant";

/**
 * Higher-order function to wrap API Route Handlers with tenant context.
 * Resolves organizationId from the user's validated JWT session.
 */
export function withTenant(handler: (req: NextRequest, context: any, tenant: any) => Promise<Response>) {
  return async (req: NextRequest, context: any) => {
    try {
      const tenantCtx = await getCurrentTenantContext();
      return await handler(req, context, tenantCtx);
    } catch (error) {
      if (error instanceof TenantForbiddenError) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      console.error("[Tenant Middleware Error]:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

/**
 * Example usage in an API route:
 * 
 * export const GET = withTenant(async (req, ctx, tenant) => {
 *   const data = await prisma.product.findMany({
 *     where: { organizationId: tenant.organizationId }
 *   });
 *   return NextResponse.json(data);
 * });
 */
