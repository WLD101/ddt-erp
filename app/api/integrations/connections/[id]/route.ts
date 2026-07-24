import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentTenantContext, requireRole, tenantForbiddenResponse } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { getTenantConnectionDetails, updateTenantConnectionStatus } from "@/modules/integrations/foundation-service";
import { toSafeIntegrationError } from "@/modules/integrations/core/errors";

const patchSchema = z.object({
  status: z.enum(["pending", "connected", "degraded", "expired", "reconnect_required", "failed", "disabled", "disconnected"]),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const { id } = await context.params;
    const db = getTenantStore(ctx);
    const details = await getTenantConnectionDetails(db, id);
    return NextResponse.json({ success: true, data: details });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }
    const safe = toSafeIntegrationError(error);
    return NextResponse.json({ success: false, error: safe }, { status: safe.statusCode });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const { id } = await context.params;
    const payload = patchSchema.parse(await request.json());
    const db = getTenantStore(ctx);
    const connection = await updateTenantConnectionStatus(db, ctx, { id, status: payload.status });
    return NextResponse.json({ success: true, data: { connection } });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }
    const safe = toSafeIntegrationError(error);
    return NextResponse.json({ success: false, error: safe }, { status: safe.statusCode });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const { id } = await context.params;
    const db = getTenantStore(ctx);
    const connection = await updateTenantConnectionStatus(db, ctx, { id, status: "disconnected" });
    return NextResponse.json({ success: true, data: { connection } });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }
    const safe = toSafeIntegrationError(error);
    return NextResponse.json({ success: false, error: safe }, { status: safe.statusCode });
  }
}
