import React from "react";
import Link from "next/link";
import { ArrowRight, Check, PackageCheck, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS, formatPlanLimit } from "@/lib/billing/plans";

const ctaByPlan = {
  starter: { label: "Start Starter", href: "/auth/signup" },
  business: { label: "Choose Business", href: "/auth/signup" },
  pro: { label: "Book Pro Demo", href: "/book-demo" },
  enterprise: { label: "Talk to Sales", href: "/contact" },
} as const;

export default function PricingPage() {
  const plans = PLAN_ORDER.map((planId) => PLANS[planId]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <section className="pt-24 pb-16 text-center">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
            <Store className="h-3.5 w-3.5" />
            Flexible SaaS Packages
          </div>
          <h1 className="mb-6 text-5xl font-black uppercase italic tracking-tighter text-white md:text-7xl">
            Pricing Built For
            <br />
            <span className="text-primary">Retail And Wholesale Teams</span>
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg text-muted-foreground">
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
                className={`flex flex-col rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-2 ${
                  plan.highlight
                    ? "scale-[1.02] border-primary/50 bg-white/[0.03] shadow-2xl shadow-primary/10 ring-1 ring-primary/20"
                    : "border-white/5 bg-black/40 shadow-xl hover:border-white/10"
                } animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-backwards`}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                {plan.highlight ? (
                  <div className="mb-6 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                    Most Popular
                  </div>
                ) : null}

                <div className="mb-5">
                  <h2 className="text-2xl font-black text-white">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.tagline}</p>
                </div>

                <div className="mb-6 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight text-white">{plan.price.display}</span>
                  {plan.price.cadence ? <span className="pb-1 text-sm font-medium text-muted-foreground">{plan.price.cadence}</span> : null}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branches</p>
                    <p className="mt-1 text-lg font-black text-white">{branchLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Users</p>
                    <p className="mt-1 text-lg font-black text-white">{userLabel}</p>
                  </div>
                </div>

                <div className="mb-8 space-y-3 flex-1">
                  {plan.includedModules.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-white/80">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-6 rounded-2xl border border-white/5 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Support</p>
                  <p className="mt-2 text-sm font-medium text-white/80">{plan.supportLabel}</p>
                </div>

                <Link href={cta.href} className="w-full">
                  <Button
                    className={`h-12 w-full rounded-xl font-bold uppercase tracking-tight group ${
                      plan.highlight
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
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

      <section className="relative mb-24 border-y border-white/5 bg-primary/5 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/5 bg-black/20 p-6">
            <PackageCheck className="mb-4 h-8 w-8 text-primary" />
            <h3 className="text-xl font-black text-white">No surprise setup fees</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Start with a monthly package, onboard your team, and expand branches only when your operations need it.
            </p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-black/20 p-6">
            <Store className="mb-4 h-8 w-8 text-primary" />
            <h3 className="text-xl font-black text-white">Built for connected commerce</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Business and Pro packages are ready for WooCommerce, Shopify, Daraz, and CSV-based operations.
            </p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-black/20 p-6">
            <ShieldCheck className="mb-4 h-8 w-8 text-primary" />
            <h3 className="text-xl font-black text-white">Upgrade when complexity grows</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Enterprise is available for multi-company groups, API-led teams, and custom workflow rollouts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
