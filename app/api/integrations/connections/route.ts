import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentTenantContext, requireRole, tenantForbiddenResponse } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { createTenantConnection, listTenantConnections } from "@/modules/integrations/foundation-service";
import { toSafeIntegrationError } from "@/modules/integrations/core/errors";

const createConnectionSchema = z.object({
  providerKey: z.string().min(1),
  connectionName: z.string().min(1),
  branchId: z.string().optional(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  grantedScopes: z.array(z.string()).optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const db = getTenantStore(ctx);
    const connections = await listTenantConnections(db);
    return NextResponse.json({ success: true, data: { connections } });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }

    return NextResponse.json(
      { success: false, error: { code: "INTEGRATION_CONNECTION_LIST_FAILED", message: "Unable to load integration connections." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const payload = createConnectionSchema.parse(await request.json());
    const db = getTenantStore(ctx);
    const connection = await createTenantConnection(db, ctx, payload);
    return NextResponse.json({ success: true, data: { connection } });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }
    const safe = toSafeIntegrationError(error);
    return NextResponse.json({ success: false, error: safe }, { status: safe.statusCode });
  }
}
