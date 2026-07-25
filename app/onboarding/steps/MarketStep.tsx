"use client";

import { Globe2, Loader2, MapPinned } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveMarketSelectionAction } from "@/modules/onboarding/actions";
import { MARKET_PROFILES, marketKeySchema, type MarketKey } from "@/modules/onboarding/market-profiles";

interface MarketStepProps {
  stepId: string;
  onComplete: (stepId: string) => void;
  state: any;
}

export function MarketStep({ stepId, onComplete, state }: MarketStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const initial = marketKeySchema.safeParse(state?.marketKey || state?.selectedMarketKey);
  const [selectedMarket, setSelectedMarket] = useState<MarketKey | null>(initial.success ? initial.data : null);

  const handleSubmit = async () => {
    if (!selectedMarket) {
      toast.error("Select a market before continuing.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await saveMarketSelectionAction({ marketKey: selectedMarket });
      if (!result.success) {
        toast.error(result.error || "Failed to save market");
        return;
      }

      toast.success("Market profile saved.");
      onComplete(stepId);
    } catch {
      toast.error("Failed to save market");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
          <Globe2 className="h-6 w-6 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface md:text-5xl">
            Choose your <span className="text-cyan-300">market</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base text-on-surface-variant">
            This sets your default currency, locale, time zone, country code, and the industries and integrations we prioritize for setup.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {Object.values(MARKET_PROFILES).map((market) => {
          const active = selectedMarket === market.key;
          return (
            <button
              key={market.key}
              type="button"
              onClick={() => setSelectedMarket(market.key)}
              className={cn(
                "rounded-[2rem] border p-6 text-left transition-all duration-200",
                active
                  ? "border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.16)]"
                  : "border-outline-variant/20 bg-surface-container-low/40 hover:border-outline-variant/40"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300">{market.name}</p>
                  <h2 className="mt-3 text-2xl font-black text-on-surface">
                    {market.currency} · {market.locale}
                  </h2>
                </div>
                <div className={cn("rounded-2xl border p-3", active ? "border-cyan-300/30 bg-cyan-400/10" : "border-outline-variant/20 bg-surface")}>
                  <MapPinned className={cn("h-5 w-5", active ? "text-cyan-300" : "text-on-surface-variant")} />
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                {market.website.heroBody}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {market.featuredIndustryProfiles.map((profile) => (
                  <span
                    key={profile}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant"
                  >
                    {profile.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !selectedMarket}
          className="h-14 rounded-2xl bg-primary px-10 font-black uppercase tracking-widest text-on-primary shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
        </Button>
      </div>
    </div>
  );
}
