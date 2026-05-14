"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Bell, CheckCircle2, CreditCard, FileText, Loader2, Package, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/modules/onboarding/actions";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/inventory", icon: Package, label: "Inventory", color: "text-amber-500", bg: "bg-amber-500/10" },
  { href: "/customers", icon: Users, label: "Customers", color: "text-violet-500", bg: "bg-violet-500/10" },
  { href: "/sales/quotes", icon: FileText, label: "Quotes", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { href: "/reports", icon: BarChart3, label: "Reports", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { href: "/notifications", icon: Bell, label: "Alerts", color: "text-primary", bg: "bg-primary/10" },
  { href: "/finances/accounts", icon: CreditCard, label: "Treasury", color: "text-cyan-500", bg: "bg-cyan-500/10" },
];

interface Props {
  stepId: string;
  onComplete: (id: string) => void;
  onSkip?: (id: string) => void;
}

export function CompleteStep({ stepId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleGoToDashboard = () => {
    startTransition(async () => {
      const result = await completeOnboarding();
      if (!result.success) {
        return;
      }
      router.push("/dashboard");
    });
  };

  return (
    <div className="space-y-12">
      <div className="space-y-6 text-center">
        <div className="relative inline-block">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-primary shadow-[0_0_60px_rgba(16,185,129,0.22)]">
            <CheckCircle2 className="h-12 w-12 text-on-surface drop-shadow-lg" />
          </div>
          <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-on-surface">
            You&apos;re <span className="text-emerald-500">All Set!</span>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-on-surface-variant">
            Your workspace is ready. Here&apos;s what you can explore right now - everything is set up for your first real operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {QUICK_LINKS.map(({ href, icon: Icon, label, color, bg }) => (
          <a
            key={href}
            href={href}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-5 text-center transition-all duration-200 hover:bg-surface-container-low"
          >
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant transition-colors group-hover:text-on-surface">
              {label}
            </span>
          </a>
        ))}
      </div>

      <Button
        onClick={handleGoToDashboard}
        disabled={isPending}
        className="h-16 w-full rounded-2xl bg-primary text-base font-black uppercase tracking-widest text-on-surface shadow-[0_15px_40px_rgba(124,58,237,0.22)] transition-all active:scale-95 hover:bg-primary/90"
      >
        {isPending ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Enter Your Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>

      <p className="text-center text-[10px] font-medium text-on-surface-variant/60">
        You can return to this setup checklist any time from Settings - Getting Started.
      </p>
    </div>
  );
}

