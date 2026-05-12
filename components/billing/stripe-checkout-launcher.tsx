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
};

export function StripeCheckoutLauncher({
  planId,
  planName,
  initialBillingCycle = "MONTHLY",
  availableCycles,
  compact = false,
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
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex flex-wrap gap-2">
        {cycleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setBillingCycle(option.value)}
            className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
              billingCycle === option.value
                ? "border-indigo-400/40 bg-indigo-500/15 text-white"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
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
        className="marketing-button-primary h-12 w-full rounded-2xl text-sm font-bold"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        Continue to secure checkout
      </Button>

      {!compact ? (
        <p className="text-xs leading-relaxed text-slate-400">
          Stripe will securely handle card collection for the <span className="font-bold text-white">{planName}</span> plan.
          Access is activated only after the verified webhook confirms payment.
        </p>
      ) : null}
    </div>
  );
}
