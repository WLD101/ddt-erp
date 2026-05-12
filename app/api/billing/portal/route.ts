import { NextResponse } from "next/server";

import { createStripeBillingPortalSession } from "@/lib/billing/subscription";
import { getCurrentTenantContext, tenantForbiddenResponse, TenantForbiddenError } from "@/lib/tenant";

export async function POST() {
  try {
    const ctx = await getCurrentTenantContext();
    const url = await createStripeBillingPortalSession({
      organizationId: ctx.organizationId,
      returnPath: "/settings/billing",
    });

    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return tenantForbiddenResponse(error);
    }
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "/";
    return NextResponse.redirect(
      `${appUrl}/settings/billing?portalError=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to open billing portal.",
      )}`,
      { status: 303 },
    );
  }
}
