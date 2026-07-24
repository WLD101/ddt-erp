import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentTenantContext, requireRole, tenantForbiddenResponse } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { executeIntegrationAction } from "@/modules/integrations/foundation-service";
import { toSafeIntegrationError } from "@/modules/integrations/core/errors";

const executeSchema = z.object({
  tenantIntegrationId: z.string().min(1),
  request: z.object({
    actionKey: z.string().min(1),
    idempotencyKey: z.string().optional(),
    resourceId: z.string().optional(),
    payload: z.record(z.string(), z.unknown()).default({}),
  }),
});

export async function POST(request: Request) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const payload = executeSchema.parse(await request.json());
    const db = getTenantStore(ctx);
    const result = await executeIntegrationAction(db, ctx, payload);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }
    const safe = toSafeIntegrationError(error);
    return NextResponse.json({ success: false, error: safe }, { status: safe.statusCode });
  }
}
