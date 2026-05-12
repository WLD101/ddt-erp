"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Calculator, Layers3, ReceiptText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/billing/plans";
import {
  PACKAGE_PROFILE_STORAGE_KEY,
  recommendPackage,
  type TeamSizeBand,
} from "@/lib/package-fit";

const TEAM_OPTIONS: TeamSizeBand[] = ["1-10", "11-50", "51-200", "201+"];
type PackageFitProfile = {
  teamSize: TeamSizeBand;
  branchCount: number;
  monthlyInvoices: number;
  needsCommerceSync: boolean;
};

export function PackageFitCalculator() {
  const [profile, setProfile] = useState<PackageFitProfile>({
    teamSize: "1-10",
    branchCount: 1,
    monthlyInvoices: 100,
    needsCommerceSync: false,
  });

  const recommendation = useMemo(() => recommendPackage(profile), [profile]);
  const plan = PLANS[recommendation.planId];

  useEffect(() => {
    localStorage.setItem(PACKAGE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  return (
    <section className="relative z-10 px-6 pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="glass-card glass-card-strong overflow-hidden rounded-[40px] p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-300">
                  <Calculator className="h-3.5 w-3.5" />
                  Package fit calculator
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                  Find the right package in under 30 seconds.
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
                  Tell us how your team operates and we will point you to the cleanest starting plan. You can still adjust it during onboarding.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Team size</span>
                  <select
                    value={profile.teamSize}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, teamSize: event.target.value as TeamSizeBand }))
                    }
                    className="marketing-input h-12 w-full rounded-2xl px-4 text-sm outline-none transition"
                  >
                    {TEAM_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-slate-950">
                        {option} employees
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Branches</span>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={profile.branchCount}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          branchCount: Number.parseInt(event.target.value || "1", 10) || 1,
                        }))
                      }
                      className="marketing-input h-12 w-full rounded-2xl pl-11 pr-4 text-sm outline-none transition"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Invoices / month</span>
                  <div className="relative">
                    <ReceiptText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={profile.monthlyInvoices}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          monthlyInvoices: Number.parseInt(event.target.value || "0", 10) || 0,
                        }))
                      }
                      className="marketing-input h-12 w-full rounded-2xl pl-11 pr-4 text-sm outline-none transition"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Commerce sync</span>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        needsCommerceSync: !current.needsCommerceSync,
                      }))
                    }
                    className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition ${
                      profile.needsCommerceSync
                        ? "border-indigo-400/40 bg-indigo-500/12 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/8"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Layers3 className="h-4 w-4 text-indigo-300" />
                      Need Shopify / WooCommerce / Daraz
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                        profile.needsCommerceSync ? "bg-indigo-500/20 text-indigo-200" : "bg-white/8 text-slate-400"
                      }`}
                    >
                      {profile.needsCommerceSync ? "Yes" : "No"}
                    </span>
                  </button>
                </label>
              </div>
            </div>

            <div className="glass-card rounded-[32px] border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                Suggested starting point
              </div>
              <div className="mt-5 space-y-4">
                <div className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200">
                  {recommendation.planName}
                </div>
                <h3 className="text-3xl font-black tracking-tight text-white">{plan.name}</h3>
                <p className="text-sm leading-relaxed text-slate-300">{recommendation.reason}</p>
                <p className="text-sm leading-relaxed text-slate-400">{recommendation.summary}</p>
              </div>

              <div className="mt-6 grid gap-3 rounded-[28px] border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Users included</span>
                  <strong className="text-white">{plan.limits.maxUsers > 9000 ? "Unlimited" : plan.limits.maxUsers}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Branches included</span>
                  <strong className="text-white">{plan.limits.maxBranches > 9000 ? "Unlimited" : plan.limits.maxBranches}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Starting price</span>
                  <strong className="text-white">{plan.price.display}{plan.price.cadence}</strong>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="marketing-button-primary h-12 flex-1 rounded-2xl text-sm font-bold">
                  <Link href="/auth/signup">
                    Start with {plan.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="marketing-button-secondary h-12 flex-1 rounded-2xl text-sm font-bold">
                  <Link href="/pricing">Compare packages</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
