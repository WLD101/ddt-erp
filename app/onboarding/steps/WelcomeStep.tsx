"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight,
  Building2,
  Database,
  Loader2,
  Package,
  ShoppingCart,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { saveWelcomeStep, seedDemoData } from "@/modules/onboarding/actions";
import { cn } from "@/lib/utils";

const BUSINESS_TYPES = [
  { id: "wholesaler", label: "Wholesaler", icon: Package, desc: "Bulk sales to retailers and resellers" },
  { id: "retailer", label: "Retailer", icon: ShoppingCart, desc: "Direct sales to end consumers" },
  { id: "reseller", label: "Reseller", icon: Building2, desc: "Buy and resell products" },
  { id: "service", label: "Service", icon: Wrench, desc: "Service-based or consulting business" },
  { id: "other", label: "Other", icon: Sparkles, desc: "Something else entirely" },
];

interface Props {
  stepId: string;
  onComplete: (id: string) => void;
  onSkip?: (id: string) => void;
}

export function WelcomeStep({ stepId, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSeeding, startSeed] = useTransition();

  const handleContinue = () => {
    if (!selected) {
      toast.error("Please select your business type");
      return;
    }

    startTransition(async () => {
      await saveWelcomeStep({ businessType: selected as any });
      onComplete(stepId);
    });
  };

  const handleSeedDemo = () => {
    startSeed(async () => {
      const result = await seedDemoData();
      if (result.success) {
        toast.success("Demo data loaded! Explore freely.");
        onComplete(stepId);
      } else {
        toast.error(result.error || "Failed to load demo data");
      }
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-indigo-600 shadow-[0_0_40px_rgba(124,58,237,0.2)]">
          <Sparkles className="h-8 w-8 text-on-surface" />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-on-surface">
            Welcome to <span className="text-primary">WhatsQuery</span>
          </h1>
          <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-on-surface-variant">
            Let&apos;s get your business set up in minutes. First, tell us what kind of business you run.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BUSINESS_TYPES.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={cn(
              "group flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200",
              selected === id
                ? "border-primary/40 bg-primary/10 shadow-[0_0_20px_rgba(124,58,237,0.12)]"
                : "border-outline-variant/20 bg-surface-container-low/50 hover:border-outline-variant/40 hover:bg-surface-container-low"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                selected === id
                  ? "bg-primary/20 text-primary"
                  : "border border-outline-variant/20 bg-surface text-on-surface-variant"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-black uppercase tracking-tight text-on-surface">{label}</p>
              <p className="text-[11px] leading-relaxed text-on-surface-variant">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 pt-2 sm:flex-row">
        <Button
          onClick={handleContinue}
          disabled={!selected || isPending}
          className="h-14 flex-1 rounded-2xl bg-primary text-sm font-black uppercase tracking-widest text-on-primary shadow-[0_10px_30px_rgba(124,58,237,0.22)] transition-all active:scale-95 hover:bg-primary/90"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Begin Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          onClick={handleSeedDemo}
          disabled={isSeeding}
          variant="outline"
          className="h-14 rounded-2xl border-outline-variant/30 bg-surface px-6 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low"
        >
          {isSeeding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Database className="mr-2 h-4 w-4" />
          )}
          Load Demo Data
        </Button>
      </div>

      <p className="text-[10px] font-medium text-on-surface-variant/60">
        Demo data creates sample products, customers, and quotations you can delete at any time.
      </p>
    </div>
  );
}

