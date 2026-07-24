import { NextResponse } from "next/server";

import { getCurrentTenantContext, requireRole, tenantForbiddenResponse } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { approveIntegrationAction } from "@/modules/integrations/foundation-service";
import { toSafeIntegrationError } from "@/modules/integrations/core/errors";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const { id } = await context.params;
    const db = getTenantStore(ctx);
    const approval = await approveIntegrationAction(db, ctx, { approvalRequestId: id, approve: false });
    return NextResponse.json({ success: true, data: { approval } });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }
    const safe = toSafeIntegrationError(error);
    return NextResponse.json({ success: false, error: safe }, { status: safe.statusCode });
  }
}
