import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createStripeCheckoutSession } from "@/lib/billing/subscription";
import { type PlanId, normalizePlanId } from "@/lib/billing/plans";
import { getCurrentTenantContext, tenantForbiddenResponse, TenantForbiddenError, requirePermission, requireRole } from "@/lib/tenant";
import { assertTrustedMutationRequest, RequestOriginError } from "@/lib/security/request-origin";

const checkoutSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]),
  trialPeriodDays: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    assertTrustedMutationRequest(request);
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid checkout request." }, { status: 400 });
    }

    const planId = normalizePlanId(parsed.data.planId) as PlanId | null;
    if (!planId || planId === "enterprise") {
      return NextResponse.json({ error: "Enterprise subscriptions require manual activation." }, { status: 400 });
    }

    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    requirePermission(ctx, "billing.manage");
    const stripeSession = await createStripeCheckoutSession({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      userEmail: session.user.email,
      userName: session.user.name,
      planId,
      billingCycle: parsed.data.billingCycle,
      trialPeriodDays: parsed.data.trialPeriodDays,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return tenantForbiddenResponse(error);
    }
    if (error instanceof RequestOriginError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: "Unable to start Stripe checkout right now." },
      { status: 500 },
    );
  }
}
