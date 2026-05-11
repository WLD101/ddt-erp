import React from "react";
import Link from "next/link";
import { ArrowRight, Check, PackageCheck, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS, formatPlanLimit } from "@/lib/billing/plans";

const ctaByPlan = {
  starter: { label: "Start Free", href: "/auth/signup" },
  business: { label: "Start Trial", href: "/auth/signup" },
  pro: { label: "Choose Pro", href: "/auth/signup" },
  enterprise: { label: "Contact Sales", href: "/contact" },
} as const;

export default function PricingPage() {
  const plans = PLAN_ORDER.map((planId) => PLANS[planId]);

  return (
    <div className="relative min-h-screen w-full flex flex-col selection:bg-indigo-500/40 selection:text-white">
      
      {/* Page Header */}
      <section className="pt-20 pb-16 text-center relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-indigo-300 reveal">
            <Store className="h-4 w-4" />
            Transparent Pricing Plans
          </div>
          <h1 className="mb-6 text-5xl md:text-7xl font-black tracking-tight text-white leading-[0.9] reveal stagger-1">
            BUILT FOR<br/>
            <span className="hero-gradient">RETAIL & WHOLESALE</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 reveal stagger-2">
            Flexible subscriptions tailored to branch counts, processing volumes, and integrated sales channels.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="relative pb-24 z-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-4">
          {plans.map((plan, index) => {
            const cta = ctaByPlan[plan.id];
            const branchLabel = formatPlanLimit(plan.limits.maxBranches);
            const userLabel = formatPlanLimit(plan.limits.maxUsers);

            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-[32px] p-8 transition-all duration-500 hover:-translate-y-2 glass-card relative ${
                  plan.highlight 
                    ? "border-indigo-500/40 scale-[1.03] shadow-[0_30px_60px_-15px_rgba(99,102,241,0.3)]" 
                    : "hover:border-white/20"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-lg tracking-wide">
                    RECOMMENDED
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                  <p className="mt-2 text-sm text-slate-400 min-h-[40px] leading-snug">{plan.tagline}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight text-white">{plan.price.display}</span>
                  {plan.price.cadence && <span className="text-sm text-slate-500 font-medium">{plan.price.cadence}</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6 py-4 border-y border-white/5 text-sm font-medium">
                  <div className="text-center border-r border-white/5">
                    <p className="text-slate-500 text-xs mb-1">Branches</p>
                    <p className="text-white text-lg font-bold">{branchLabel}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 text-xs mb-1">Users</p>
                    <p className="text-white text-lg font-bold">{userLabel}</p>
                  </div>
                </div>

                <div className="space-y-3.5 flex-1 mb-8">
                  {plan.includedModules.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${plan.highlight ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-indigo-400'}`}>
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href={cta.href} className="w-full mt-auto">
                  <Button
                    className={`w-full h-12 rounded-xl font-bold tracking-wide transition-all active:scale-95 border-t ${
                      plan.highlight
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_10px_20px_rgba(99,102,241,0.3)] border-indigo-400/30"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    }`}
                  >
                    {cta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust Features */}
      <section className="relative pb-24 z-10 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 border-t border-white/5 pt-16">
          <div className="flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <PackageCheck className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">No Surprise Fees</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Start with a fixed monthly subscription and onboard instantly. Pay as you scale.</p>
            </div>
          </div>
          
          <div className="flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Store className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Retail-Ready</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Out-of-the-box support for WooCommerce, Shopify, and direct Daraz API sync.</p>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Enterprise Grade</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Dedicated compliance ready architecture, audit trailing, and multi-level group permissions.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
