"use client";

import { useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { type BillingCycle, type PlanId } from "@/lib/billing/plans";

type StripeCheckoutLauncherProps = {
  planId: PlanId;
  planName: string;
  initialBillingCycle?: Extract<BillingCycle, "MONTHLY" | "YEARLY">;
  availableCycles: {
    monthly: boolean;
    yearly: boolean;
  };
  compact?: boolean;
  ctaLabel?: string;
};

export function StripeCheckoutLauncher({
  planId,
  planName,
  initialBillingCycle = "MONTHLY",
  availableCycles,
  compact = false,
  ctaLabel,
}: StripeCheckoutLauncherProps) {
  const [billingCycle, setBillingCycle] = useState<Extract<BillingCycle, "MONTHLY" | "YEARLY">>(initialBillingCycle);
  const [loading, setLoading] = useState(false);

  const cycleOptions = useMemo(
    () =>
      [
        availableCycles.monthly ? { value: "MONTHLY" as const, label: "Monthly" } : null,
        availableCycles.yearly ? { value: "YEARLY" as const, label: "Yearly" } : null,
      ].filter(Boolean) as { value: "MONTHLY" | "YEARLY"; label: string }[],
    [availableCycles.monthly, availableCycles.yearly],
  );

  async function startCheckout() {
    setLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      });
      const payload = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to start Stripe checkout.");
      }
      window.location.assign(payload.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start Stripe checkout.");
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="flex flex-wrap gap-2">
        {cycleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setBillingCycle(option.value)}
            className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              billingCycle === option.value
                ? "border-indigo-400/40 bg-indigo-500/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                : "border-white/5 bg-white/5 text-slate-500 hover:bg-white/10"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="marketing-button-primary h-12 w-full rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        {ctaLabel || "Continue to secure checkout"}
      </Button>

      {!compact ? (
        <p className="text-xs leading-relaxed text-slate-400 font-medium italic">
          Stripe will securely handle card collection for the <span className="font-bold text-white tracking-tight">{planName}</span> plan.
          Access is activated instantly after payment verification.
        </p>
      ) : null}
    </div>
  );
}
