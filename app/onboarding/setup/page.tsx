"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Rocket, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

const STEPS = [
  { id: "org", label: "Creating your organization", icon: ShieldCheck },
  { id: "modules", label: "Configuring modules", icon: Zap },
  { id: "dashboard", label: "Preparing dashboard", icon: Rocket },
];

export default function SetupPage() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    if (currentStepIndex < STEPS.length) {
      const timer = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, STEPS[currentStepIndex].id]);
        setCurrentStepIndex((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }

    const redirectTimer = setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
    return () => clearTimeout(redirectTimer);
  }, [currentStepIndex, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-lowest p-4">
      <div className="w-full max-w-md space-y-12 text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-[100px]" />
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] border border-outline-variant/20 bg-surface shadow-soft animate-pulse">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="animate-in fade-in slide-in-from-bottom-4 text-4xl font-black tracking-tight text-on-surface duration-700">
            Setting up your <span className="text-primary">workspace...</span>
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-4 text-lg text-on-surface-variant duration-700 delay-100">
            This will take a few seconds
          </p>
        </div>

        <div className="mx-auto max-w-sm space-y-4 text-left">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStepIndex === index;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500",
                  isCompleted
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : isCurrent
                      ? "scale-[1.02] border-primary/20 bg-primary/5"
                      : "border-outline-variant/20 bg-surface-container-low/40 opacity-40"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500",
                    isCompleted
                      ? "bg-emerald-500 text-on-surface"
                      : isCurrent
                        ? "animate-pulse bg-primary text-on-primary"
                        : "border border-outline-variant/20 bg-surface text-on-surface-variant"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-sm font-bold",
                      isCompleted ? "text-emerald-500" : isCurrent ? "text-on-surface" : "text-on-surface-variant"
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent ? (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full animate-[loading_1.5s_ease-in-out_infinite] bg-primary"
                        style={{ width: "100%" }}
                      />
                    </div>
                  ) : null}
                </div>
                {isCompleted ? (
                  <div className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
                    Done
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="pt-8 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
          WhatsQuery Intelligence Engine • Secure Provisioning
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

