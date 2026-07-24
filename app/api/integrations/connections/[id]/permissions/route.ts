import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentTenantContext, requireRole, tenantForbiddenResponse } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { getTenantConnectionDetails, saveIntegrationPermissions } from "@/modules/integrations/foundation-service";
import { toSafeIntegrationError } from "@/modules/integrations/core/errors";

const savePermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      subjectType: z.enum(["tenant", "role", "user", "voice_agent"]),
      subjectId: z.string().min(1),
      actionKey: z.string().min(1),
      effect: z.enum(["allow", "deny", "approval_required"]),
      approvalMode: z.string().optional(),
    })
  ),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const { id } = await context.params;
    const db = getTenantStore(ctx);
    const details = await getTenantConnectionDetails(db, id);
    return NextResponse.json({ success: true, data: { permissions: details.permissions } });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }
    const safe = toSafeIntegrationError(error);
    return NextResponse.json({ success: false, error: safe }, { status: safe.statusCode });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const { id } = await context.params;
    const payload = savePermissionsSchema.parse(await request.json());
    const db = getTenantStore(ctx);
    await saveIntegrationPermissions(db, ctx, { id, permissions: payload.permissions });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }
    const safe = toSafeIntegrationError(error);
    return NextResponse.json({ success: false, error: safe }, { status: safe.statusCode });
  }
}
