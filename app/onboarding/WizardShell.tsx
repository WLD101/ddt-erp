"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { WelcomeStep } from "./steps/WelcomeStep";
import { IndustryStep } from "./steps/IndustryStep";
import { ProfileStep } from "./steps/ProfileStep";
import { BranchStep } from "./steps/BranchStep";
import { ProductStep } from "./steps/ProductStep";
import { CustomerStep } from "./steps/CustomerStep";
import { InviteStep } from "./steps/InviteStep";
import { TransactionStep } from "./steps/TransactionStep";
import { CompleteStep } from "./steps/CompleteStep";
import { cn } from "@/lib/utils";

type Step = { id: string; label: string; skippable: boolean };

interface WizardShellProps {
  initialStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  steps: Step[];
  state: any;
}

const STEP_COMPONENTS = [
  WelcomeStep,
  IndustryStep,
  ProfileStep,
  BranchStep,
  ProductStep,
  CustomerStep,
  InviteStep,
  TransactionStep,
  CompleteStep,
];

export function WizardShell({
  initialStep,
  completedSteps: initCompleted,
  skippedSteps: initSkipped,
  steps,
  state,
}: WizardShellProps) {
  const [currentStep, setCurrentStep] = useState(Math.min(initialStep, steps.length - 1));
  const [completedSteps, setCompletedSteps] = useState<string[]>(initCompleted);

  const goNext = (stepId: string) => {
    setCompletedSteps((prev) => Array.from(new Set([...prev, stepId])));
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goToStep = (index: number) => {
    if (index <= currentStep || completedSteps.includes(steps[index].id)) {
      setCurrentStep(index);
    }
  };

  const StepComponent = STEP_COMPONENTS[currentStep] ?? WelcomeStep;
  const progress = (completedSteps.length / (steps.length - 1)) * 100;

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row">
      <aside className="glass-card flex shrink-0 flex-col gap-8 border-r border-white/8 bg-white/[0.03] p-8 backdrop-blur-sm lg:w-72 lg:rounded-r-[32px] lg:p-10 xl:w-80">
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-300">
            <span>Setup Progress</span>
            <span className="text-indigo-200">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 shadow-[0_0_8px_rgba(124,58,237,0.6)] transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

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
                  "group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left transition-all duration-200",
                  isCurrent && "border border-indigo-400/30 bg-indigo-500/[0.12] shadow-[0_0_0_1px_rgba(129,140,248,0.12)]",
                  !isCurrent && isDone && "opacity-90 hover:bg-white/6 hover:opacity-100",
                  !isCurrent && !isDone && "cursor-default opacity-65"
                )}
                disabled={!isAccessible}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[10px] font-black transition-all",
                    isDone && "border border-emerald-500/30 bg-emerald-500/20",
                    isCurrent && !isDone && "border border-indigo-400/40 bg-indigo-500/20 shadow-[0_0_10px_rgba(124,58,237,0.3)]",
                    !isDone && !isCurrent && "border border-white/10 bg-white/5"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <span className={cn(isCurrent ? "text-indigo-200" : "text-slate-400")}>{idx + 1}</span>
                  )}
                </div>
                <div>
                  <p
                  className={cn(
                    "text-[11px] font-black uppercase leading-none tracking-widest",
                    isCurrent ? "text-white" : isDone ? "text-slate-200" : "text-slate-300"
                  )}
                >
                  {step.label}
                </p>
                {step.skippable && !isDone && isCurrent ? (
                    <p className="mt-1 text-[9px] font-medium text-slate-300">Optional</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/8 pt-6">
          <a
            href="/"
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-colors hover:text-white"
          >
            <span className="h-px w-4 bg-white/15 transition-all group-hover:w-6" />
            Finish Later
          </a>
        </div>
      </aside>

      <main className="flex flex-1 items-start justify-center overflow-y-auto p-8 lg:p-16 xl:p-20">
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-right-6 duration-500">
          <div className="glass-card rounded-[32px] border border-white/8 p-8 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.45)] lg:p-10">
            <StepComponent
              stepId={steps[currentStep]?.id ?? "welcome"}
              onComplete={(stepId) => goNext(stepId)}
              onSkip={steps[currentStep]?.skippable ? (stepId) => goNext(stepId) : undefined}
              state={state}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

