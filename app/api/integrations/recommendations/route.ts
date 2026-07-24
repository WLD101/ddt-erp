import { NextResponse } from "next/server";

import { getCurrentTenantContext, tenantForbiddenResponse } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { listIntegrationProvidersForTenant } from "@/modules/integrations/foundation-service";

export async function GET() {
  try {
    const ctx = await getCurrentTenantContext();
    const db = getTenantStore(ctx);
    const organization = await db.organization.findUnique({
      where: { id: db.organizationId },
      select: { industryProfileKey: true },
    });
    const recommendations = await listIntegrationProvidersForTenant(db, {
      industryProfileKey: (organization?.industryProfileKey as never) || undefined,
    });
    return NextResponse.json({ success: true, data: { recommendations } });
  } catch (error) {
    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }

    return NextResponse.json(
      { success: false, error: { code: "INTEGRATION_RECOMMENDATIONS_FAILED", message: "Unable to load integration recommendations." } },
      { status: 500 }
    );
  }
}
