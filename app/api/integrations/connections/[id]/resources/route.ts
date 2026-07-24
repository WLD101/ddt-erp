import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentTenantContext, requireRole, tenantForbiddenResponse } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { listIntegrationResources, saveIntegrationResources } from "@/modules/integrations/foundation-service";
import { toSafeIntegrationError } from "@/modules/integrations/core/errors";

const saveResourcesSchema = z.object({
  resources: z.array(
    z.object({
      resourceType: z.string().min(1),
      externalId: z.string().min(1),
      name: z.string().min(1),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
  ),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const { id } = await context.params;
    const db = getTenantStore(ctx);
    const resources = await listIntegrationResources(db, ctx, id);
    return NextResponse.json({ success: true, data: { resources } });
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
    const payload = saveResourcesSchema.parse(await request.json());
    const db = getTenantStore(ctx);
    await saveIntegrationResources(db, ctx, { id, resources: payload.resources });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }
    const safe = toSafeIntegrationError(error);
    return NextResponse.json({ success: false, error: safe }, { status: safe.statusCode });
  }
}
