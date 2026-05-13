"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StripeCheckoutLauncher } from "@/components/billing/stripe-checkout-launcher";
import { selectPackageAction } from "@/modules/packages/actions";
import { PACKAGE_PROFILE_STORAGE_KEY, recommendPackage, type PackageProfileInput } from "@/lib/package-fit";
import { PLANS, type PlanId } from "@/lib/billing/plans";

type PackageItem = {
  id: string;
  name: string;
  businessSize: string | null;
  userLimit: number;
  featureJson: string;
  isCustom: boolean;
  planId: PlanId;
  availableCycles: {
    monthly: boolean;
    yearly: boolean;
  };
};

export function PackageSelectionClient({ packages }: { packages: PackageItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PackageProfileInput | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(PACKAGE_PROFILE_STORAGE_KEY);
    if (!raw) return;
    try {
      setProfile(JSON.parse(raw));
    } catch {
      localStorage.removeItem(PACKAGE_PROFILE_STORAGE_KEY);
    }
  }, []);

  const recommendation = useMemo(() => (profile ? recommendPackage(profile) : null), [profile]);

  async function select(pkg: PackageItem) {
    setPendingId(pkg.id);
    try {
      const result = await selectPackageAction({ enterprise: true });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.status === "enterprise_pending") {
        toast.success("Enterprise request sent. Platform admin will activate your account.");
      }
      router.push(result.redirectTo || "/settings/billing");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {recommendation ? (
        <section className="glass-card rounded-[32px] border border-indigo-400/15 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">Recommended for your team</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{recommendation.planName}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{recommendation.reason} {recommendation.summary}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-300">
              {recommendation.planId === "enterprise"
                ? "Custom rollout, admin activation, and bespoke limits."
                : `${PLANS[recommendation.planId].price.display}${PLANS[recommendation.planId].price.cadence}`}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
      {packages.map((pkg) => (
        <article
          key={pkg.id}
          className={`glass-card rounded-[32px] border p-6 transition-all duration-300 ${
            recommendation?.planName.toLowerCase() === pkg.name.toLowerCase()
              ? "border-indigo-400/40 shadow-[0_0_30px_rgba(99,102,241,0.18)]"
              : "border-white/8 hover:border-white/18"
          }`}
        >
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">
              {pkg.businessSize || "ERP package"}
            </p>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">{pkg.name}</h2>
              {recommendation?.planName.toLowerCase() === pkg.name.toLowerCase() ? (
                <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200">
                  Best fit
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-400">
              {pkg.isCustom
                ? "Custom limits and features handled by platform admin."
                : `${pkg.userLimit} users included.`}
            </p>
          </div>
          {pkg.isCustom ? (
            <Button
              className="marketing-button-primary mt-6 h-11 w-full rounded-2xl font-bold"
              onClick={() => select(pkg)}
              disabled={pendingId !== null}
            >
              {pendingId === pkg.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Request Enterprise
            </Button>
          ) : (
            <div className="mt-6 space-y-3">
              <StripeCheckoutLauncher
                planId={pkg.planId}
                planName={pkg.name}
                availableCycles={pkg.availableCycles}
              />
              <p className="text-xs leading-relaxed text-slate-400">
                Package selection and billing are confirmed together. Your workspace activates only after Stripe&apos;s verified webhook completes.
              </p>
            </div>
          )}
        </article>
      ))}
      </div>
    </div>
  );
}

