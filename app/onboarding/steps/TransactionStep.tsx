"use client";

import { useTransition } from "react";
import { skipOnboardingStep } from "@/modules/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ShoppingCart, ArrowRight, SkipForward, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props { stepId: string; onComplete: (id: string) => void; onSkip?: (id: string) => void; }

export function TransactionStep({ stepId, onComplete, onSkip }: Props) {
  const [isSkipping, startSkip] = useTransition();
  const router = useRouter();

  const handleSkip = () => {
    startSkip(async () => {
      await skipOnboardingStep("transaction");
      onSkip?.(stepId);
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Your First <span className="text-rose-400">Deal</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            Start with a quotation to your customer, or go straight to a confirmed sale. Both are a 2-minute form.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Quote path */}
        <Link href="/sales/quotes/new">
          <div className="group p-7 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all duration-300 cursor-pointer text-left space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-base font-black text-white uppercase tracking-tight">Create Quotation</p>
              <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                Draft a commercial proposal for a customer. They review and accept it before any commitment.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              Start Proposal <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Sale path */}
        <Link href="/sales/new">
          <div className="group p-7 bg-primary/5 border border-primary/20 rounded-3xl hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer text-left space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-black text-white uppercase tracking-tight">Create Sale Invoice</p>
              <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                Go straight to a confirmed sale. Reduces inventory immediately and records the receivable.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
              Create Invoice <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleSkip}
        disabled={isSkipping}
        className="w-full h-12 bg-white/[0.03] border-white/10 text-muted-foreground hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest"
      >
        {isSkipping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <SkipForward className="w-4 h-4 mr-2" />}
        Skip for Now — Set Up Later
      </Button>
    </div>
  );
}
