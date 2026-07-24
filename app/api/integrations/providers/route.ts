import { NextResponse } from "next/server";

import { getCurrentTenantContext, tenantForbiddenResponse } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { listIntegrationProvidersForTenant } from "@/modules/integrations/foundation-service";

export async function GET() {
  try {
    const ctx = await getCurrentTenantContext();
    const db = getTenantStore(ctx);
    const providers = await listIntegrationProvidersForTenant(db);
    return NextResponse.json({ success: true, data: { providers } });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }

    return NextResponse.json(
      { success: false, error: { code: "INTEGRATION_PROVIDER_LIST_FAILED", message: "Unable to load integration providers." } },
      { status: 500 }
    );
  }
}
