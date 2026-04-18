"use client";

import { useTransition } from "react";
import { saveWelcomeStep } from "@/modules/onboarding/actions";
import { seedDemoData } from "@/modules/onboarding/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Building2, ShoppingCart, Package, Wrench, ArrowRight, Sparkles, Database } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const BUSINESS_TYPES = [
  { id: "wholesaler", label: "Wholesaler", icon: Package, desc: "Bulk sales to retailers and resellers" },
  { id: "retailer",   label: "Retailer",   icon: ShoppingCart, desc: "Direct sales to end consumers" },
  { id: "reseller",   label: "Reseller",   icon: Building2, desc: "Buy and resell products" },
  { id: "service",    label: "Service",    icon: Wrench, desc: "Service-based or consulting business" },
  { id: "other",      label: "Other",      icon: Sparkles, desc: "Something else entirely" },
];

interface Props { stepId: string; onComplete: (id: string) => void; onSkip?: (id: string) => void; }

export function WelcomeStep({ stepId, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSeeding, startSeed] = useTransition();

  const handleContinue = () => {
    if (!selected) { toast.error("Please select your business type"); return; }
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
      {/* Headline */}
      <div className="space-y-4">
        <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.5)]">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
            Welcome to <span className="text-primary">NexusERP</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-2 leading-relaxed max-w-md">
            Let's get your business set up in minutes. First, tell us what kind of business you run.
          </p>
        </div>
      </div>

      {/* Business Type Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BUSINESS_TYPES.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={cn(
              "p-5 rounded-2xl border text-left flex items-start gap-4 transition-all duration-200 group",
              selected === id
                ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(124,58,237,0.2)]"
                : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
              selected === id ? "bg-primary/20" : "bg-white/5 group-hover:bg-white/10"
            )}>
              <Icon className={cn("w-5 h-5", selected === id ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-black text-white uppercase tracking-tight">{label}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button
          onClick={handleContinue}
          disabled={!selected || isPending}
          className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(124,58,237,0.35)] transition-all active:scale-95"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Begin Setup <ArrowRight className="ml-2 w-4 h-4" /></>}
        </Button>
        <Button
          onClick={handleSeedDemo}
          disabled={isSeeding}
          variant="outline"
          className="h-14 px-6 bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06] font-bold text-xs uppercase tracking-widest rounded-xl"
        >
          {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
          Load Demo Data
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground/40 font-medium">
        Demo data creates sample products, customers, and quotations you can delete at any time.
      </p>
    </div>
  );
}
