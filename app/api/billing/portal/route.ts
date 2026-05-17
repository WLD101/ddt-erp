import { NextResponse } from "next/server";

import { createStripeBillingPortalSession } from "@/lib/billing/subscription";
import { getCurrentTenantContext, tenantForbiddenResponse, TenantForbiddenError, requirePermission, requireRole } from "@/lib/tenant";
import { assertTrustedMutationRequest, RequestOriginError } from "@/lib/security/request-origin";

export async function POST(request: Request) {
  try {
    assertTrustedMutationRequest(request);
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    requirePermission(ctx, "billing.manage");
    const url = await createStripeBillingPortalSession({
      organizationId: ctx.organizationId,
      returnPath: "/settings/billing",
    });

    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return tenantForbiddenResponse(error);
    }
    if (error instanceof RequestOriginError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "/";
    return NextResponse.redirect(
      `${appUrl}/settings/billing?portalError=${encodeURIComponent("Unable to open billing portal.")}`,
      { status: 303 },
    );
  }
}
