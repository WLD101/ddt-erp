import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubscriptionContext } from "@/lib/billing/enforcement";
import { getCurrentTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const ctx = await getCurrentTenantContext();
  const subCtx = await getSubscriptionContext(ctx.organizationId);
  const params = await searchParams;
  const sessionId = params.session_id;
  const isActive = ["active", "trialing", "grace_period"].includes(subCtx.status);
  const refreshHref = sessionId ? `/checkout/success?session_id=${encodeURIComponent(sessionId)}` : "/checkout/success";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center px-6 py-12">
      <Card className="glass-card w-full rounded-[32px] border border-white/10">
        <CardHeader className="space-y-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Stripe checkout</p>
          <CardTitle className="text-4xl font-black tracking-tight text-white">
            {isActive ? "Subscription activated" : "Payment received"}
          </CardTitle>
          <CardDescription className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400">
            {isActive
              ? `Your ${subCtx.plan.name} workspace is active. Continue onboarding to finish the ERP setup.`
              : "Stripe has redirected you back successfully. We are waiting for the verified webhook to finalize activation. This usually completes in a few seconds."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-[28px] border border-white/8 bg-black/20 p-5 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span>Plan</span>
              <strong className="text-white">{subCtx.plan.name}</strong>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span>Subscription status</span>
              <strong className="text-white uppercase">{subCtx.status}</strong>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span>Payment status</span>
              <strong className="text-white uppercase">{subCtx.paymentStatus}</strong>
            </div>
            {sessionId ? (
              <div className="mt-3 flex items-center justify-between gap-4">
                <span>Checkout session</span>
                <strong className="text-white">{sessionId}</strong>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={isActive ? "/onboarding" : refreshHref}
              className="marketing-button-primary inline-flex h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-bold text-white"
            >
              {isActive ? "Continue onboarding" : "Refresh activation"}
            </Link>
            <Link
              href="/settings/billing"
              className="marketing-button-secondary inline-flex h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-bold text-white"
            >
              Open billing
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
