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
      <aside className="flex shrink-0 flex-col gap-8 border-r border-outline-variant/20 bg-surface/85 p-8 backdrop-blur-sm lg:w-72 lg:p-10 xl:w-80">
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
            <span>Setup Progress</span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400 shadow-[0_0_8px_rgba(124,58,237,0.6)] transition-all duration-700 ease-out"
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
                  isCurrent && "border border-primary/20 bg-primary/10",
                  !isCurrent && isDone && "opacity-70 hover:bg-surface-container-low/60 hover:opacity-100",
                  !isCurrent && !isDone && "cursor-default opacity-30"
                )}
                disabled={!isAccessible}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[10px] font-black transition-all",
                    isDone && "border border-emerald-500/30 bg-emerald-500/20",
                    isCurrent && !isDone && "border border-primary/40 bg-primary/20 shadow-[0_0_10px_rgba(124,58,237,0.3)]",
                    !isDone && !isCurrent && "border border-outline-variant/20 bg-surface-container-low"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <span className={cn(isCurrent ? "text-primary" : "text-on-surface-variant")}>{idx + 1}</span>
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[11px] font-black uppercase leading-none tracking-widest",
                      isCurrent
                        ? "text-on-surface"
                        : isDone
                          ? "text-on-surface-variant"
                          : "text-on-surface-variant/60"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.skippable && !isDone && isCurrent ? (
                    <p className="mt-1 text-[9px] font-medium text-on-surface-variant/60">Optional</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-outline-variant/20 pt-6">
          <a
            href="/"
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <span className="h-px w-4 bg-outline-variant/40 transition-all group-hover:w-6" />
            Finish Later
          </a>
        </div>
      </aside>

      <main className="flex flex-1 items-start justify-center overflow-y-auto p-8 lg:p-16 xl:p-20">
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-right-6 duration-500">
          <div className="rounded-[32px] border border-outline-variant/20 bg-surface p-8 shadow-soft lg:p-10">
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

