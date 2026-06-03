"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Zap, Store, ShieldCheck, ArrowRight } from "lucide-react";
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

function readFeatureMeta(featureJson: string | null | undefined) {
  if (!featureJson || typeof featureJson !== "string") return {};
  try {
    const parsed = JSON.parse(featureJson);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function PackageSelectionClient({ 
  packages, 
  isDemoOrTrial = false 
}: { 
  packages: PackageItem[]; 
  isDemoOrTrial?: boolean;
}) {
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

  async function select(pkg: PackageItem, demoMode = false) {
    const actionId = demoMode ? `${pkg.id}-demo` : pkg.id;
    setPendingId(actionId);
    try {
      const result = await selectPackageAction(
        pkg.isCustom ? { enterprise: true } : { packageId: pkg.id, demoMode }
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.status === "enterprise_pending") {
        toast.success("Enterprise request sent. Platform admin will activate your account.");
      } else {
        toast.success("Package selected successfully.");
      }
      router.push(result.redirectTo || "/settings/billing");
    } catch (e) {
      toast.error("Failed to select package.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {recommendation ? (
        <section className="glass-card rounded-[32px] border border-indigo-400/25 p-8 bg-indigo-500/[0.02] shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">
                <Zap className="h-3 w-3 fill-indigo-500" />
                Recommended for you
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">{recommendation.planName}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 font-medium">{recommendation.reason} {recommendation.summary}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/40 px-8 py-6 shadow-inner">
              {(() => {
                const pkg = packages.find(p => p.name.toLowerCase() === recommendation.planName.toLowerCase());
                if (!pkg || pkg.isCustom) return <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Custom Activation</span>;
                
                const meta: any = readFeatureMeta(pkg.featureJson);
                
                const isDiscounted = (meta.discountEnabled === true || meta.discountEnabled === "true") && meta.originalMonthlyPrice && meta.discountedMonthlyPrice;
                const displayPrice = isDiscounted ? meta.discountedMonthlyPrice : (meta.monthlyPrice ?? PLANS[recommendation.planId].price.monthly);
                const originalPrice = meta.originalMonthlyPrice;
                const discountLabel = meta.monthlyDiscountLabel;

                return (
                  <div className="flex flex-col items-end">
                    {isDiscounted ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-slate-500 line-through font-bold opacity-60">Rs. {originalPrice.toLocaleString()}</span>
                          {discountLabel && (
                            <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-500/20">
                              {discountLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white tracking-tighter">Rs. {displayPrice.toLocaleString()}</span>
                          <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">/MO</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white tracking-tighter">Rs. {displayPrice.toLocaleString()}</span>
                        <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">/MO</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
      {packages.map((pkg) => {
        const meta: any = readFeatureMeta(pkg.featureJson);
        
        const isDiscounted = (meta.discountEnabled === true || meta.discountEnabled === "true") && meta.originalMonthlyPrice && meta.discountedMonthlyPrice;
        const displayPrice = isDiscounted ? meta.discountedMonthlyPrice : (meta.monthlyPrice ?? PLANS[pkg.planId].price.monthly);
        const originalPrice = meta.originalMonthlyPrice;
        const discountLabel = meta.monthlyDiscountLabel;

        const isEnterprise = pkg.isCustom;
        const ctaLabel = isEnterprise ? "Contact Sales" : (isDemoOrTrial ? "Start Free Trial" : `Start ${pkg.name}`);

        return (
          <article
            key={pkg.id}
            className={`glass-card rounded-[32px] border p-8 transition-all duration-500 flex flex-col group ${
              recommendation?.planName.toLowerCase() === pkg.name.toLowerCase()
                ? "border-indigo-500/40 shadow-[0_30px_60px_-15px_rgba(99,102,241,0.25)] bg-indigo-500/[0.03] lg:scale-[1.02]"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">
                {pkg.businessSize || "ERP package"}
              </p>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">{pkg.name}</h2>
                {recommendation?.planName.toLowerCase() === pkg.name.toLowerCase() ? (
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                ) : null}
              </div>
              <p className="text-sm text-slate-400 font-medium leading-snug min-h-[40px]">
                {pkg.isCustom
                  ? "Bespoke limits and features handled by platform admin."
                  : `${pkg.userLimit} team members included.`}
              </p>
            </div>

            <div className="mt-6 mb-4 min-h-[70px] flex flex-col justify-end">
              {pkg.isCustom ? (
                <div className="text-xl font-black text-white uppercase tracking-widest">Custom Rate</div>
              ) : (
                <div className="space-y-1">
                   {isDiscounted ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 line-through font-bold opacity-60">Rs. {originalPrice.toLocaleString()}</span>
                        {discountLabel && (
                          <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-indigo-500/20">
                            {discountLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white tracking-tighter">Rs. {displayPrice.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 font-black tracking-[0.2em] uppercase">/mo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white tracking-tighter">Rs. {displayPrice.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 font-black tracking-[0.2em] uppercase">/mo</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {pkg.isCustom ? (
              <Button
                className="marketing-button-primary mt-auto h-12 w-full rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => select(pkg)}
                disabled={pendingId !== null}
              >
                {pendingId === pkg.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Store className="mr-2 h-4 w-4" />}
                Contact Sales
              </Button>
            ) : isDemoOrTrial ? (
              <Button
                className="marketing-button-primary mt-auto h-12 w-full rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => select(pkg, true)}
                disabled={pendingId !== null}
              >
                {pendingId === pkg.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Start Free Trial
              </Button>
            ) : (
              <div className="mt-auto space-y-6 pt-6">
                <div className="space-y-4">
                  <StripeCheckoutLauncher
                    planId={pkg.planId}
                    planName={pkg.name}
                    availableCycles={pkg.availableCycles}
                    compact
                    ctaLabel={`Start ${pkg.name}`}
                  />
                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <ShieldCheck className="h-3 w-3 text-indigo-500" />
                    Powered by Stripe Secure
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => select(pkg, true)}
                    disabled={pendingId !== null}
                    className="w-full text-[10px] font-black text-slate-400 hover:text-indigo-300 uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 group/eval disabled:opacity-50"
                  >
                    {pendingId === `${pkg.id}-demo` ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    <span>Switch to 7-day Demo</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/eval:translate-x-1" />
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
      </div>
    </div>
  );
}
