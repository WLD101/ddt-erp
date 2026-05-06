"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowRight, FileText, Loader2, ShoppingCart, SkipForward, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { skipOnboardingStep } from "@/modules/onboarding/actions";

interface Props {
  stepId: string;
  onComplete: (id: string) => void;
  onSkip?: (id: string) => void;
}

export function TransactionStep({ stepId, onSkip }: Props) {
  const [isSkipping, startSkip] = useTransition();

  const handleSkip = () => {
    startSkip(async () => {
      await skipOnboardingStep("transaction");
      onSkip?.(stepId);
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
          <TrendingUp className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface">
            Your First <span className="text-rose-500">Deal</span>
          </h1>
          <p className="mt-1 max-w-sm text-sm text-on-surface-variant">
            Start with a quotation to your customer, or go straight to a confirmed sale. Both are a 2-minute form.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Link href="/sales/quotes/new">
          <div className="group space-y-4 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-7 text-left transition-all duration-300 hover:border-indigo-500/40 hover:bg-indigo-500/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 transition-all group-hover:bg-indigo-500/20">
              <FileText className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-base font-black uppercase tracking-tight text-on-surface">Create Quotation</p>
              <p className="mt-1 text-[12px] leading-relaxed text-on-surface-variant">
                Draft a commercial proposal for a customer. They review and accept it before any commitment.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500">
              Start Proposal
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        <Link href="/sales/new">
          <div className="group space-y-4 rounded-3xl border border-primary/20 bg-primary/5 p-7 text-left transition-all duration-300 hover:border-primary/40 hover:bg-primary/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 transition-all group-hover:bg-primary/20">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-black uppercase tracking-tight text-on-surface">Create Sale Invoice</p>
              <p className="mt-1 text-[12px] leading-relaxed text-on-surface-variant">
                Go straight to a confirmed sale. Reduces inventory immediately and records the receivable.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
              Create Invoice
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleSkip}
        disabled={isSkipping}
        className="h-12 w-full rounded-xl border-outline-variant/30 bg-surface text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low"
      >
        {isSkipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SkipForward className="mr-2 h-4 w-4" />}
        Skip for Now - Set Up Later
      </Button>
    </div>
  );
}

