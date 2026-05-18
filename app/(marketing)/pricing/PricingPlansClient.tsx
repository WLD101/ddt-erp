"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, ShieldCheck, Store, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

type BillingMode = "MONTHLY" | "YEARLY";

export type PricingPlanCard = {
  id: string;
  planId: string;
  name: string;
  tagline: string;
  audience: string;
  highlight: boolean;
  isEnterprise: boolean;
  dedicatedInfraRequired: boolean;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  annualEquivalent: number | null;
  savingsPercent: number | null;
  promoEnabled: boolean;
  promoLabel: string | null;
  branches: number;
  users: number;
  products: number;
  customers: number;
  suppliers: number;
  monthlyInvoices: number;
  monthlyPurchases: number;
  dailyExports: number;
  monthlyAssistantActions: number;
  supportLabel: string;
  modules: string[];
};

function formatCurrency(value: number | null, suffix = "") {
  if (value === null) return "Custom";
  return `PKR ${value.toLocaleString()}${suffix}`;
}

function formatLimit(value: number | null) {
  if (value === null) return "Custom";
  if (value > 9000) return "Custom";
  return value.toLocaleString();
}

export function PricingPlansClient({ plans }: { plans: PricingPlanCard[] }) {
  const [billingMode, setBillingMode] = useState<BillingMode>("YEARLY");

  const displayPlans = useMemo(
    () =>
      plans.map((plan) => {
        const ctaHref = plan.isEnterprise
          ? "/contact"
          : `/auth/signup?mode=paid&plan=${plan.planId}&billingCycle=${billingMode}`;
        const ctaLabel = plan.isEnterprise ? "Contact Sales" : billingMode === "YEARLY" ? `Start ${plan.name} Annual` : `Start ${plan.name}`;

        return {
          ...plan,
          ctaHref,
          ctaLabel,
          displayPrice:
            billingMode === "YEARLY"
              ? formatCurrency(plan.yearlyPrice, "/year")
              : formatCurrency(plan.monthlyPrice, "/month"),
        };
      }),
    [billingMode, plans],
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col selection:bg-primary/30 selection:text-white">
      <section className="relative overflow-hidden pt-24 pb-12 text-center">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            <Zap className="h-3.5 w-3.5" />
            Shared infrastructure pricing built for sustainable growth
          </div>
          <h1 className="mx-auto max-w-5xl text-5xl font-black tracking-tight text-white md:text-7xl">
            Choose a plan that fits your growth
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
            Annual online payments unlock the current promotional pricing. Shared-VPS plans stay protected with fair limits, while Enterprise moves to dedicated resources.
          </p>

          <div className="mt-8 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
            {(["MONTHLY", "YEARLY"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBillingMode(mode)}
                className={`rounded-xl px-5 py-2.5 text-sm font-black tracking-wide transition ${
                  billingMode === mode
                    ? "bg-white text-slate-950 shadow-lg"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {mode === "MONTHLY" ? "Monthly" : "Annual (Recommended)"}
              </button>
            ))}
          </div>

          {billingMode === "YEARLY" ? (
            <p className="mt-4 text-sm font-bold text-emerald-300">
              Limited Time Offer - Pay annually and get 4 months FREE
            </p>
          ) : null}
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 lg:grid-cols-4">
          {displayPlans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-[28px] border p-7 shadow-2xl transition-all duration-300 ${
                plan.highlight
                  ? "border-primary/50 bg-primary/[0.08] shadow-primary/15"
                  : "border-white/10 bg-slate-950/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-white">{plan.name}</h2>
                  <p className="mt-2 min-h-[48px] text-sm leading-relaxed text-slate-400">{plan.tagline}</p>
                </div>
                {plan.highlight ? (
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                    Best Value
                  </span>
                ) : null}
              </div>

              <div className="mt-6 min-h-[104px]">
                {billingMode === "YEARLY" && plan.promoEnabled && plan.annualEquivalent ? (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500 line-through">
                      {formatCurrency(plan.annualEquivalent, "/year")}
                    </span>
                    {plan.savingsPercent ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                        Save {plan.savingsPercent}%
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="text-4xl font-black tracking-tight text-white md:text-5xl">{plan.displayPrice}</div>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{plan.supportLabel}</p>
                {billingMode === "YEARLY" && plan.promoEnabled && plan.promoLabel ? (
                  <p className="mt-3 text-xs font-medium leading-relaxed text-indigo-200">{plan.promoLabel}</p>
                ) : null}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Branches</p>
                  <p className="mt-1 text-xl font-black text-white">{formatLimit(plan.branches)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Users</p>
                  <p className="mt-1 text-xl font-black text-white">{formatLimit(plan.users)}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-slate-300">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Products</p>
                  <p>{formatLimit(plan.products)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Customers</p>
                  <p>{formatLimit(plan.customers)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Suppliers</p>
                  <p>{formatLimit(plan.suppliers)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Invoices / mo</p>
                  <p>{formatLimit(plan.monthlyInvoices)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Purchases / mo</p>
                  <p>{formatLimit(plan.monthlyPurchases)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Exports / day</p>
                  <p>{formatLimit(plan.dailyExports)}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Assistant actions / mo</p>
                  <p>{formatLimit(plan.monthlyAssistantActions)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {plan.modules.slice(0, 6).map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-slate-200">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link href={plan.ctaHref}>
                  <Button className={`h-12 w-full rounded-2xl text-sm font-black ${plan.highlight ? "" : "bg-white/10 hover:bg-white/15 text-white"}`}>
                    {plan.ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                {plan.dedicatedInfraRequired ? (
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    Dedicated resources available after infrastructure review. No shared-resource unlimited plan is exposed publicly.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/10 pt-16 md:grid-cols-3">
          <div className="flex gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-primary/20 bg-primary/10 text-primary">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">VPS-safe scaling</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Usage caps, async-heavy jobs, and tenant-scoped limits keep one workspace from slowing everyone else down.
              </p>
            </div>
          </div>
          <div className="flex gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Annual online savings</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Annual promotional pricing is designed for online checkout, while manual billing stays controlled for support-led deals.
              </p>
            </div>
          </div>
          <div className="flex gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-blue-400/20 bg-blue-400/10 text-blue-300">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Fair, auditable limits</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Workspace usage is measured against real data so owners see clear upgrade signals before hard limits interrupt operations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
