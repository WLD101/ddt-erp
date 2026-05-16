import React from "react";
import Link from "next/link";
import { ArrowRight, Check, PackageCheck, ShieldCheck, Store, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS, formatPlanLimit } from "@/lib/billing/plans";
import { getActivePackages } from "@/modules/packages/actions";
import { inferPlanIdFromPackage } from "@/lib/billing/catalog";

export const dynamic = "force-dynamic";

type PricingPackage = {
  id: string;
  name: string;
  businessSize: string | null;
  userLimit: number;
  featureJson: string;
  isCustom: boolean;
};

function parsePackageMeta(featureJson: string) {
  try {
    const meta = JSON.parse(featureJson);
    return {
      ...meta,
      discountEnabled: meta.discountEnabled === true || meta.discountEnabled === "true",
    };
  } catch {
    return {};
  }
}

function buildFallbackPackages(): PricingPackage[] {
  return PLAN_ORDER.map((planId) => {
    const plan = PLANS[planId];
    return {
      id: `fallback-${plan.id}`,
      name: plan.name,
      businessSize: plan.audience,
      userLimit: plan.limits.maxUsers,
      featureJson: JSON.stringify({
        planId: plan.id,
        monthlyPrice: plan.price.monthly,
        displayPrice: `${plan.price.display}${plan.price.cadence}`,
        branchLimit: plan.limits.maxBranches,
        modules: plan.includedModules,
        supportLabel: plan.supportLabel,
        tagline: plan.tagline,
        discountEnabled: false,
      }),
      isCustom: plan.id === "enterprise",
    };
  });
}

export default async function PricingPage() {
  let dbPackages: PricingPackage[] = buildFallbackPackages();
  try {
    dbPackages = await getActivePackages();
  } catch (error) {
    console.error("[pricing-page] falling back to static package catalog", error);
  }
  
  // Sort and filter to match PLAN_ORDER if possible
  const displayedPackages = dbPackages
    .filter(pkg => !pkg.isCustom || pkg.name.toLowerCase() === "enterprise")
    .sort((a, b) => {
      const aId = inferPlanIdFromPackage(a);
      const bId = inferPlanIdFromPackage(b);
      return PLAN_ORDER.indexOf(aId) - PLAN_ORDER.indexOf(bId);
    });

  return (
    <div className="relative min-h-screen w-full flex flex-col selection:bg-indigo-500/40 selection:text-white">
      
      {/* Page Header */}
      <section className="pt-24 pb-16 text-center relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold tracking-wider text-indigo-300 reveal uppercase">
            <Zap className="h-3.5 w-3.5 fill-indigo-500" />
            Empowering modern commerce
          </div>
          <h1 className="mb-6 text-6xl md:text-8xl font-black tracking-tight text-white leading-[0.85] reveal stagger-1">
            PLANS THAT<br/>
            <span className="hero-gradient">SCALE WITH YOU</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 reveal stagger-2">
            Choose a plan that fits your current volume. Start with a risk-free trial or jump straight into a production-ready ERP instance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 reveal stagger-3">
            <Link href="/auth/signup?mode=trial">
              <Button className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-slate-200 font-black text-base transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-slate-500 font-medium">No credit card required for trial</p>
          </div>
        </div>
        
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-indigo-500/10 blur-[120px] rounded-full -z-10" />
      </section>

      {/* Pricing Grid */}
      <section className="relative pb-24 z-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 lg:grid-cols-4 lg:gap-4">
          {displayedPackages.map((pkg) => {
            const planId = inferPlanIdFromPackage(pkg);
            const staticPlan = PLANS[planId] || PLANS.starter;
            const meta = parsePackageMeta(pkg.featureJson);
            
            const isEnterprise = planId === "enterprise";
            const ctaLabel = isEnterprise ? "Contact Sales" : `Start ${pkg.name}`;
            const ctaHref = isEnterprise ? "/contact" : `/auth/signup?mode=paid&plan=${planId}`;
            
            const branchLabel = formatPlanLimit(meta.branchLimit ?? staticPlan.limits.maxBranches);
            const userLabel = formatPlanLimit(pkg.userLimit ?? staticPlan.limits.maxUsers);

            const isDiscounted = meta.discountEnabled && meta.originalMonthlyPrice && meta.discountedMonthlyPrice;
            const displayPrice = isDiscounted ? meta.discountedMonthlyPrice : (meta.monthlyPrice ?? staticPlan.price.monthly);
            const originalPrice = meta.originalMonthlyPrice;
            const discountLabel = meta.monthlyDiscountLabel;

            return (
              <div
                key={pkg.id}
                className={`flex flex-col rounded-[32px] p-8 transition-all duration-500 hover:-translate-y-2 glass-card relative border ${
                  staticPlan.highlight 
                    ? "border-indigo-500/50 scale-[1.02] lg:scale-[1.05] shadow-[0_30px_70px_-15px_rgba(99,102,241,0.4)] z-20 bg-indigo-500/[0.03]" 
                    : "border-white/10 hover:border-white/20 z-10"
                }`}
              >
                {staticPlan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl tracking-[0.1em] uppercase">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">{pkg.name}</h2>
                  <p className="mt-2 text-sm text-slate-400 min-h-[40px] leading-snug font-medium italic">
                    &ldquo;{meta.tagline || staticPlan.tagline}&rdquo;
                  </p>
                </div>

                <div className="mb-8 min-h-[80px] flex flex-col justify-end">
                  {isDiscounted ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base text-slate-500 line-through font-bold opacity-60">Rs. {originalPrice.toLocaleString()}</span>
                        {discountLabel && (
                          <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-indigo-500/20">
                            {discountLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-black tracking-tight text-white">Rs. {displayPrice.toLocaleString()}</span>
                        <span className="text-sm text-slate-500 font-bold uppercase tracking-tighter">/mo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-black tracking-tight text-white">
                        {displayPrice ? `Rs. ${displayPrice.toLocaleString()}` : "Custom"}
                      </span>
                      {displayPrice && <span className="text-sm text-slate-500 font-bold uppercase tracking-tighter">/mo</span>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 py-5 border-y border-white/5">
                  <div className="text-center border-r border-white/5">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Branches</p>
                    <p className="text-white text-xl font-black">{branchLabel}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Users</p>
                    <p className="text-white text-xl font-black">{userLabel}</p>
                  </div>
                </div>

                <div className="space-y-4 flex-1 mb-10">
                  {(meta.modules || staticPlan.includedModules).map((feature: string) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${staticPlan.highlight ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/5 text-indigo-400'}`}>
                        <Check className="h-3 w-3" strokeWidth={4} />
                      </div>
                      <span className="leading-snug font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href={ctaHref} className="w-full mt-auto">
                  <Button
                    className={`w-full h-14 rounded-2xl font-black tracking-wide transition-all active:scale-95 text-base border-t-2 ${
                      staticPlan.highlight
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_15px_30px_rgba(99,102,241,0.4)] border-white/20"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    }`}
                  >
                    {ctaLabel}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust Features */}
      <section className="relative pb-24 z-10 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 border-t border-white/5 pt-16">
          <div className="flex gap-6">
            <div className="w-14 h-14 rounded-[20px] bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <PackageCheck className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">No Surprise Fees</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Flat monthly subscriptions with all core features included. Scale branches and users as your business grows.</p>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="w-14 h-14 rounded-[20px] bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-lg shadow-purple-500/5">
              <Store className="h-7 w-7 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Omnichannel Ready</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Native integrations for Shopify, WooCommerce, and Daraz. Sync inventory and orders in real-time across all stores.</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-14 h-14 rounded-[20px] bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-lg shadow-blue-500/5">
              <ShieldCheck className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Bank-Grade Security</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Enterprise-ready data isolation, end-to-end encryption, and comprehensive audit logs for every transaction.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
