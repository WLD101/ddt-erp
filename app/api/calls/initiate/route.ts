import { NextResponse } from "next/server";
import { getCurrentTenantContext, requireRole, TenantForbiddenError } from "@/lib/tenant";
import { telecomErrorResponse } from "@/modules/calls/errors";
import { initiateCountryRoutedCall } from "@/modules/calls/service";
import { initiateCallSchema } from "@/modules/calls/schema";

export async function POST(request: Request) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    const input = initiateCallSchema.parse(await request.json());
    const idempotencyKey = request.headers.get("idempotency-key") || input.idempotencyKey || null;
    const result = await initiateCountryRoutedCall({
      tenantId: ctx.organizationId,
      userId: ctx.userId,
      from: input.from,
      to: input.to,
      selectedCountry: input.selectedCountry,
      callerNumberId: input.callerNumberId,
      idempotencyKey,
      metadata: input.metadata,
    });

    return NextResponse.json({
      success: true,
      data: {
        callId: result.call?.id,
        status: result.call?.status,
        idempotentReplay: result.idempotentReplay,
        routeId: result.route?.id,
        provider: {
          id: result.provider.id,
          name: result.provider.name,
          type: result.provider.type,
          countryCode: result.provider.countryCode,
        },
      },
    });
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: error.message } }, { status: 403 });
    }

    const response = telecomErrorResponse(error, "Call initiation failed.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
