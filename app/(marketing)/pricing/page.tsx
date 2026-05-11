import React from "react";
import Link from "next/link";
import { ArrowRight, Check, PackageCheck, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS, formatPlanLimit } from "@/lib/billing/plans";

const ctaByPlan = {
  starter: { label: "Start Starter", href: "/auth/signup" },
  business: { label: "Choose Business", href: "/auth/signup" },
  pro: { label: "Start Pro Trial", href: "/auth/signup" },
  enterprise: { label: "Talk to Sales", href: "/contact" },
} as const;

export default function PricingPage() {
  const plans = PLAN_ORDER.map((planId) => PLANS[planId]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-surface-container-lowest">
      <section className="pt-24 pb-16 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.03),transparent_60%)] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
            <Store className="h-3.5 w-3.5" />
            Flexible SaaS Packages
          </div>
          <h1 className="mb-6 text-5xl font-black uppercase italic tracking-tighter text-on-surface md:text-7xl">
            Pricing Built For
            <br />
            <span className="text-primary">Retail And Wholesale Teams</span>
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg font-medium text-on-surface-variant">
            Choose the package that fits your branch count, team size, and ecommerce workflow. Prices are simple, monthly,
            and designed for growing teams.
          </p>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-4">
          {plans.map((plan, index) => {
            const cta = ctaByPlan[plan.id];
            const branchLabel = formatPlanLimit(plan.limits.maxBranches);
            const userLabel = formatPlanLimit(plan.limits.maxUsers);

            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-[2.5rem] border p-8 transition-all duration-300 hover:-translate-y-2 ${
                  plan.highlight
                    ? "scale-[1.02] border-primary/30 bg-surface shadow-2xl shadow-primary/5 ring-1 ring-primary/10"
                    : "border-outline-variant/30 bg-surface shadow-soft hover:border-outline-variant/60"
                } animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-backwards`}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                {plan.highlight ? (
                  <div className="mb-6 rounded-xl bg-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-primary text-center">
                    Most Popular
                  </div>
                ) : null}

                <div className="mb-5">
                  <h2 className="text-2xl font-black text-on-surface tracking-tight">{plan.name}</h2>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-on-surface-variant">{plan.tagline}</p>
                </div>

                <div className="mb-6 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tighter text-on-surface">{plan.price.display}</span>
                  {plan.price.cadence ? <span className="pb-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{plan.price.cadence}</span> : null}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-low/30 p-4 text-left">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-70">Branches</p>
                    <p className="mt-1 text-lg font-black text-on-surface tracking-tight">{branchLabel}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-70">Users</p>
                    <p className="mt-1 text-lg font-black text-on-surface tracking-tight">{userLabel}</p>
                  </div>
                </div>

                <div className="mb-8 space-y-4 flex-1">
                  {plan.includedModules.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-on-surface font-medium">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 shadow-sm">
                        <Check className="h-3 w-3 text-primary stroke-[3px]" />
                      </div>
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-70">Support</p>
                  <p className="mt-2 text-xs font-bold text-on-surface">{plan.supportLabel}</p>
                </div>

                <Link href={cta.href} className="w-full">
                  <Button
                    className={`h-12 w-full rounded-xl font-black uppercase tracking-widest text-[11px] group shadow-sm transition-all active:scale-95 ${
                      plan.highlight
                        ? "bg-primary text-on-primary hover:bg-primary/90 shadow-primary/20 shadow-lg"
                        : "border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low"
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {cta.label}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative mb-24 border-y border-outline-variant/10 bg-primary/[0.02] py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-3">
          <div className="rounded-3xl border border-outline-variant/20 bg-surface p-8 shadow-soft">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm">
              <PackageCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-black text-on-surface mb-3 tracking-tight">No surprise setup fees</h3>
            <p className="text-sm font-medium leading-relaxed text-on-surface-variant">
              Start with a monthly package, onboard your team, and expand branches only when your operations need it.
            </p>
          </div>
          <div className="rounded-3xl border border-outline-variant/20 bg-surface p-8 shadow-soft">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-black text-on-surface mb-3 tracking-tight">Built for connected commerce</h3>
            <p className="text-sm font-medium leading-relaxed text-on-surface-variant">
              Business and Pro packages are ready for WooCommerce, Shopify, Daraz, and CSV-based operations.
            </p>
          </div>
          <div className="rounded-3xl border border-outline-variant/20 bg-surface p-8 shadow-soft">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-black text-on-surface mb-3 tracking-tight">Upgrade when complexity grows</h3>
            <p className="text-sm font-medium leading-relaxed text-on-surface-variant">
              Enterprise is available for multi-company groups, API-led teams, and custom workflow rollouts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

