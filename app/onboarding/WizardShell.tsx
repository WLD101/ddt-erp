"use client";

import { useState } from "react";
import { ONBOARDING_STEPS } from "@/modules/onboarding/service";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ProfileStep } from "./steps/ProfileStep";
import { BranchStep } from "./steps/BranchStep";
import { ProductStep } from "./steps/ProductStep";
import { CustomerStep } from "./steps/CustomerStep";
import { InviteStep } from "./steps/InviteStep";
import { TransactionStep } from "./steps/TransactionStep";
import { CompleteStep } from "./steps/CompleteStep";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = { id: string; label: string; skippable: boolean };

interface WizardShellProps {
  initialStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  steps: Step[];
}

const STEP_COMPONENTS = [
  WelcomeStep,
  ProfileStep,
  BranchStep,
  ProductStep,
  CustomerStep,
  InviteStep,
  TransactionStep,
  CompleteStep,
];

export function WizardShell({ initialStep, completedSteps: initCompleted, skippedSteps: initSkipped, steps }: WizardShellProps) {
  const [currentStep, setCurrentStep] = useState(Math.min(initialStep, steps.length - 1));
  const [completedSteps, setCompletedSteps] = useState<string[]>(initCompleted);

  const goNext = (stepId: string) => {
    setCompletedSteps(prev => Array.from(new Set([...prev, stepId])));
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const goToStep = (index: number) => {
    // Can only navigate to completed steps or current
    if (index <= currentStep || completedSteps.includes(steps[index].id)) {
      setCurrentStep(index);
    }
  };

  const StepComponent = STEP_COMPONENTS[currentStep] ?? WelcomeStep;
  const progress = ((completedSteps.length) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col lg:flex-row">
      {/* Left Panel — Stepper */}
      <aside className="lg:w-72 xl:w-80 shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-sm p-8 lg:p-10 flex flex-col gap-8">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Setup Progress</span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(124,58,237,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <nav className="flex-1 space-y-1">
          {steps.map((step, idx) => {
            const isDone = completedSteps.includes(step.id);
            const isCurrent = idx === currentStep;
            const isAccessible = idx <= currentStep || isDone;

            return (
              <button
                key={step.id}
                onClick={() => goToStep(idx)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all duration-200 group",
                  isCurrent && "bg-primary/10 border border-primary/20",
                  !isCurrent && isDone && "opacity-60 hover:opacity-100 hover:bg-white/[0.03]",
                  !isCurrent && !isDone && "opacity-30 cursor-default",
                )}
                disabled={!isAccessible}
              >
                {/* Step indicator */}
                <div className={cn(
                  "h-7 w-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black transition-all",
                  isDone && "bg-emerald-500/20 border border-emerald-500/30",
                  isCurrent && !isDone && "bg-primary/20 border border-primary/40 shadow-[0_0_10px_rgba(124,58,237,0.3)]",
                  !isDone && !isCurrent && "bg-white/5 border border-white/5",
                )}>
                  {isDone
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <span className={cn(isCurrent ? "text-primary" : "text-muted-foreground")}>{idx + 1}</span>
                  }
                </div>
                <div>
                  <p className={cn(
                    "text-[11px] font-black uppercase tracking-widest leading-none",
                    isCurrent ? "text-white" : isDone ? "text-white/60" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  {step.skippable && !isDone && isCurrent && (
                    <p className="text-[9px] text-muted-foreground/50 mt-1 font-medium">Optional</p>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Finish Later */}
        <div className="border-t border-white/5 pt-6">
          <a
            href="/"
            className="text-[10px] font-black text-muted-foreground hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 group"
          >
            <span className="h-px w-4 bg-white/20 group-hover:w-6 transition-all" />
            Finish Later
          </a>
        </div>
      </aside>

      {/* Right Panel — Step Content */}
      <main className="flex-1 flex items-start justify-center p-8 lg:p-16 xl:p-20 overflow-y-auto">
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-right-6 duration-500">
          <StepComponent
            stepId={steps[currentStep]?.id ?? "welcome"}
            onComplete={(stepId) => goNext(stepId)}
            onSkip={steps[currentStep]?.skippable ? (stepId) => goNext(stepId) : undefined}
          />
        </div>
      </main>
    </div>
  );
}
