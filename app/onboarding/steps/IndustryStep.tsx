"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Boxes, CheckCircle2, ChevronRight, Factory, Loader2, Store, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateIndustryAndModulesAction } from "@/modules/onboarding/actions";
import { INDUSTRY_MODULES } from "@/modules/onboarding/service";
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
};

export function IndustryStep({ stepId, onComplete, state }: IndustryStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>(state?.industry || "retail");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  useEffect(() => {
    const modules = INDUSTRY_MODULES[selectedIndustry]?.modules.map((m) => m.id) || [];
    setSelectedModules(modules);
  }, [selectedIndustry]);

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

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-3xl font-black tracking-tight text-on-surface md:text-5xl">
          Choose your <span className="text-primary italic">industry.</span>
        </h2>
        <p className="max-w-xl text-lg text-on-surface-variant">
          WhatsQuery is built for trading, wholesale, retail, distribution, manufacturing, ecommerce, and basic service invoicing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(INDUSTRY_MODULES).map(([id, info]) => {
          const Icon = industryIcons[id] || Briefcase;
          const isSelected = selectedIndustry === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedIndustry(id)}
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

