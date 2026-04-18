import { getOnboardingState } from "@/modules/onboarding/actions";
import { ONBOARDING_STEPS } from "@/modules/onboarding/service";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export async function OnboardingChecklist() {
  let state: Awaited<ReturnType<typeof getOnboardingState>> | null = null;
  try {
    state = await getOnboardingState();
  } catch {
    return null;
  }

  if (!state || state.isCompleted) return null;

  const completed = new Set<string>(state.completedSteps);
  const skipped = new Set<string>(state.skippedSteps);
  const progress = Math.round((completed.size / (ONBOARDING_STEPS.length - 1)) * 100);

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-[28px] p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Getting Started</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{progress}% Complete</p>
          </div>
        </div>
        <Link
          href="/onboarding"
          className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest flex items-center gap-1 transition-colors"
        >
          Resume <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {ONBOARDING_STEPS.filter(s => s.id !== "complete").map(step => {
          const isDone = completed.has(step.id);
          const isSkipped = skipped.has(step.id);
          return (
            <div key={step.id} className="flex items-center gap-3 py-1">
              {isDone
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                : <Circle className={cn("w-4 h-4 shrink-0", isSkipped ? "text-white/20" : "text-muted-foreground")} />
              }
              <span className={cn(
                "text-xs font-bold",
                isDone ? "text-white/50 line-through" : isSkipped ? "text-white/25 italic" : "text-white"
              )}>
                {step.label}
              </span>
              {isSkipped && !isDone && <span className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-auto">Skipped</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
