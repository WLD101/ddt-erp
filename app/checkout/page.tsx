import { redirect } from "next/navigation";

import { StripeCheckoutLauncher } from "@/components/billing/stripe-checkout-launcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubscriptionContext } from "@/lib/billing/enforcement";
import { getAvailableStripeBillingCycles } from "@/lib/billing/stripe";
import { normalizePlanId } from "@/lib/billing/plans";
import { getCurrentTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const ctx = await getCurrentTenantContext();
  const subCtx = await getSubscriptionContext(ctx.organizationId);
  const planId = normalizePlanId(subCtx.sub?.planId || subCtx.assignment?.package?.name || subCtx.plan.id);

  if (!planId) {
    redirect("/onboarding/packages");
  }

  if (planId === "enterprise" || subCtx.isCustomPackage) {
    redirect("/settings/billing");
  }

  const availableCycles = getAvailableStripeBillingCycles(planId);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center px-6 py-12">
      <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-card rounded-[32px] border border-white/10">
          <CardHeader className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">Secure billing</p>
            <CardTitle className="text-4xl font-black tracking-tight text-white">Finish your subscription</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed text-slate-400">
              Complete Stripe checkout to activate the {subCtx.plan.name} workspace. After payment confirmation, you will return to onboarding and continue setup immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-white">{subCtx.plan.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{subCtx.plan.tagline}</p>
                </div>
                <div className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200">
                  {subCtx.plan.supportLabel}
                </div>
              </div>
            </div>

            <StripeCheckoutLauncher
              planId={planId}
              planName={subCtx.plan.name}
              initialBillingCycle={(subCtx.billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY")}
              availableCycles={availableCycles}
            />
          </CardContent>
        </Card>

        <Card className="glass-card rounded-[32px] border border-white/10">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">What happens next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              1. Stripe collects the payment method securely.
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              2. A verified webhook activates your subscription and records the billing profile.
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              3. WhatsQuery continues your onboarding with paid access enabled.
            </div>
            {!availableCycles.yearly ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-amber-100">
                Yearly checkout is not configured yet for this plan. Monthly billing is available immediately.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
