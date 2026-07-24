"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Boxes, CheckCircle2, ChevronRight, Factory, Loader2, Store, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateIndustryAndModulesAction } from "@/modules/onboarding/actions";
import { INDUSTRY_MODULES } from "@/modules/onboarding/service";
import {
  industryProfileKeySchema,
  onboardingOperationalAnswersSchema,
  resolveIndustryProfileRecommendation,
  type IndustryProfileKey,
  type OnboardingOperationalAnswers,
} from "@/modules/onboarding/industry-profiles";
import {
  getAvailableIndustryProfilesForMarket,
  getMarketProfile,
  marketKeySchema,
} from "@/modules/onboarding/market-profiles";
import { cn } from "@/lib/utils";

interface IndustryStepProps {
  stepId: string;
  onComplete: (stepId: string) => void;
  state: any;
}

const industryIcons: Record<string, any> = {
  retail: Store,
  wholesale: Boxes,
  ecommerce: Store,
  distribution: Truck,
  manufacturing: Factory,
  service_basic: Briefcase,
  restaurant_voice: Briefcase,
  clinic_voice: Briefcase,
  textile: Factory,
};

export function IndustryStep({ stepId, onComplete, state }: IndustryStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const parsedMarket = marketKeySchema.safeParse(state?.marketKey || state?.selectedMarketKey);
  const marketKey = parsedMarket.success ? parsedMarket.data : "pk";
  const market = getMarketProfile(marketKey);
  const availableIndustryProfiles = getAvailableIndustryProfilesForMarket(marketKey);
  const initialIndustry = industryProfileKeySchema.safeParse(state?.industryProfileKey || state?.industry).success
    ? (state?.industryProfileKey || state?.industry)
    : market.featuredIndustryProfiles[0];
  const safeInitialIndustry = availableIndustryProfiles.includes(initialIndustry)
    ? initialIndustry
    : market.featuredIndustryProfiles[0];
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryProfileKey>(safeInitialIndustry);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [answers, setAnswers] = useState<OnboardingOperationalAnswers>(
    onboardingOperationalAnswersSchema.parse(state?.operationalAnswers || {})
  );

  useEffect(() => {
    const modules = INDUSTRY_MODULES[selectedIndustry]?.modules.map((m) => m.id) || [];
    setSelectedModules(modules);
  }, [selectedIndustry]);

  const recommendation = resolveIndustryProfileRecommendation(selectedIndustry, answers);

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await updateIndustryAndModulesAction({
        industry: selectedIndustry,
        modules: selectedModules,
        operationalAnswers: answers,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Industry and modules configured.");
        onComplete(stepId);
      }
    } catch {
      toast.error("Failed to save selection.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateAnswer = <K extends keyof OnboardingOperationalAnswers>(key: K, value: OnboardingOperationalAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleResource = (value: "staff" | "branches" | "machines" | "rooms" | "vehicles") => {
    setAnswers((prev) => ({
      ...prev,
      resourceAssignment: prev.resourceAssignment.includes(value)
        ? prev.resourceAssignment.filter((item) => item !== value)
        : [...prev.resourceAssignment, value],
    }));
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-3xl font-black tracking-tight text-on-surface md:text-5xl">
          Choose your <span className="text-primary italic">industry.</span>
        </h2>
        <p className="max-w-xl text-lg text-on-surface-variant">
          WhatsQuery is built for verified industries in {market.name}. We prioritize the workflows, terminology, and integrations that match this market first.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(INDUSTRY_MODULES).filter(([id]) => availableIndustryProfiles.includes(id as IndustryProfileKey)).map(([id, info]) => {
          const Icon = industryIcons[id] || Briefcase;
          const isSelected = selectedIndustry === id;
          const industryId = industryProfileKeySchema.parse(id);
          return (
            <button
              key={id}
              onClick={() => setSelectedIndustry(industryId)}
              className={cn(
                "relative flex flex-col items-center rounded-[2rem] border p-6 transition-all duration-300",
                isSelected
                  ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(124,58,237,0.14)]"
                  : "border-outline-variant/20 bg-surface-container-low/40 hover:border-outline-variant/40"
              )}
            >
              <div
                className={cn(
                  "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500",
                  isSelected
                    ? "scale-110 bg-primary text-on-primary"
                    : "border border-outline-variant/20 bg-surface text-on-surface-variant"
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isSelected ? "text-primary" : "text-on-surface-variant"
                )}
              >
                {info.label}
              </span>
              {isSelected ? (
                <div className="absolute right-4 top-4 animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="space-y-6 border-t border-outline-variant/20 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black uppercase tracking-wider text-on-surface">Recommended Modules</h3>
          <span className="rounded bg-surface-container px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {selectedModules.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {INDUSTRY_MODULES[selectedIndustry]?.modules.map((mod) => {
            const isActive = selectedModules.includes(mod.id);
            return (
              <div
                key={mod.id}
                onClick={() => toggleModule(mod.id)}
                className={cn(
                  "flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all duration-200",
                  isActive
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-outline-variant/20 bg-surface-container-low/40 opacity-70 hover:opacity-100"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border transition-all",
                    isActive ? "border-emerald-500 bg-emerald-500 text-on-surface" : "border-outline-variant/30"
                  )}
                >
                  {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                </div>
                <div>
                  <p className={cn("mb-1 text-sm font-bold", isActive ? "text-on-surface" : "text-on-surface-variant")}>
                    {mod.label}
                  </p>
                  <p className="text-[11px] leading-tight text-on-surface-variant">{mod.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6 border-t border-outline-variant/20 pt-6">
        <div className="space-y-2">
          <h3 className="text-lg font-black uppercase tracking-wider text-on-surface">Operational Setup</h3>
          <p className="max-w-2xl text-sm text-on-surface-variant">
            Tell us how the business actually runs so WhatsQuery can resolve the right profile, terminology, recommendations, and later integrations for {market.name}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Order timing</span>
            <select
              value={answers.fulfilmentMode}
              onChange={(event) => updateAnswer("fulfilmentMode", event.target.value as any)}
              className="h-12 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 px-4 text-sm text-on-surface"
            >
              <option value="immediate">Immediate orders</option>
              <option value="future">Future bookings</option>
              <option value="both">Both immediate and future</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">What do you sell?</span>
            <select
              value={answers.offeringType}
              onChange={(event) => updateAnswer("offeringType", event.target.value as any)}
              className="h-12 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 px-4 text-sm text-on-surface"
            >
              <option value="products">Products</option>
              <option value="services">Services</option>
              <option value="manufactured_goods">Manufactured goods</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Payment pattern</span>
            <select
              value={answers.paymentPattern}
              onChange={(event) => updateAnswer("paymentPattern", event.target.value as any)}
              className="h-12 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 px-4 text-sm text-on-surface"
            >
              <option value="immediate">Immediate payment</option>
              <option value="deposit">Deposit or partial upfront</option>
              <option value="invoice">Invoice / credit terms</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Fulfilment options</span>
            <select
              value={answers.offersDeliveryOrCollection}
              onChange={(event) => updateAnswer("offersDeliveryOrCollection", event.target.value as any)}
              className="h-12 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 px-4 text-sm text-on-surface"
            >
              <option value="none">No delivery or collection</option>
              <option value="collection">Collection only</option>
              <option value="delivery">Delivery only</option>
              <option value="both">Delivery and collection</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            ["requiresQuotes", "Quotations before confirmation"],
            ["managesInventory", "Manage inventory"],
            ["managesRawMaterials", "Manage ingredients or raw materials"],
            ["preparesBeforeFulfilment", "Prepare or manufacture before fulfilment"],
            ["recurringNeeds", "Recurring services or recurring bookings"],
          ].map(([key, label]) => {
            const active = Boolean(answers[key as keyof OnboardingOperationalAnswers]);
            return (
              <button
                key={key}
                type="button"
                onClick={() => updateAnswer(key as any, !active as any)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                  active
                    ? "border-primary/40 bg-primary/10 text-on-surface"
                    : "border-outline-variant/20 bg-surface-container-low/40 text-on-surface-variant"
                )}
              >
                <span className="text-sm font-bold">{label}</span>
                <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-primary" : "text-on-surface-variant/70")}>
                  {active ? "Yes" : "No"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Assigned resources</span>
          <div className="flex flex-wrap gap-3">
            {[
              ["staff", "Staff"],
              ["branches", "Branches"],
              ["machines", "Machines"],
              ["rooms", "Rooms"],
              ["vehicles", "Vehicles"],
            ].map(([value, label]) => {
              const active = answers.resourceAssignment.includes(value as any);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleResource(value as any)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-outline-variant/20 bg-surface-container-low/40 text-on-surface-variant"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">Resolved Profile</h4>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
              Score {recommendation.confidenceScore}
            </span>
          </div>
          <p className="text-lg font-black text-on-surface">{recommendation.recommendedProfile.name}</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Terminology focus: {recommendation.recommendedProfile.terminology.primary_transaction}, {recommendation.recommendedProfile.terminology.fulfilment}, {recommendation.recommendedProfile.terminology.resource}.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Market</p>
              <p className="mt-2 text-sm text-on-surface">{market.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Operational models</p>
              <p className="mt-2 text-sm text-on-surface">{recommendation.summary.operationalModels.join(", ")}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Capabilities</p>
              <p className="mt-2 text-sm text-on-surface">{recommendation.summary.capabilities.slice(0, 4).join(", ")}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Top integrations</p>
              <p className="mt-2 text-sm text-on-surface">
                {recommendation.summary.recommendedIntegrations
                  .filter((item) => item.level === "ESSENTIAL" || item.level === "RECOMMENDED")
                  .slice(0, 3)
                  .map((item) => item.label)
                  .join(", ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-10">
        <Button
          onClick={handleSubmit}
          className="h-14 rounded-2xl bg-primary px-10 font-black uppercase tracking-widest text-on-primary shadow-lg shadow-primary/20 transition-all group active:scale-95 hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Next Step
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

