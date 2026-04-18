"use client";

import { useTransition } from "react";
import { completeOnboarding } from "@/modules/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowRight, Sparkles, Package, Users, FileText, BarChart3, Bell, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/inventory",       icon: Package,   label: "Inventory",    color: "text-amber-400",  bg: "bg-amber-500/10"  },
  { href: "/customers",       icon: Users,     label: "Customers",    color: "text-violet-400", bg: "bg-violet-500/10" },
  { href: "/sales/quotes",    icon: FileText,  label: "Quotes",       color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { href: "/reports",         icon: BarChart3, label: "Reports",      color: "text-emerald-400",bg: "bg-emerald-500/10"},
  { href: "/notifications",   icon: Bell,      label: "Alerts",       color: "text-primary",    bg: "bg-primary/10"    },
  { href: "/finances/accounts",icon: CreditCard,"label": "Treasury",  color: "text-cyan-400",   bg: "bg-cyan-500/10"   },
];

interface Props { stepId: string; onComplete: (id: string) => void; onSkip?: (id: string) => void; }

export function CompleteStep({ stepId, onComplete }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleGoToDashboard = () => {
    startTransition(async () => {
      await completeOnboarding();
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="space-y-12">
      {/* Success hero */}
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-primary flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(16,185,129,0.4)] animate-in zoom-in duration-500">
            <CheckCircle2 className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
          <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center animate-bounce">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
            You're <span className="text-emerald-400">All Set!</span>
          </h1>
          <p className="text-muted-foreground text-base mt-2 leading-relaxed max-w-md mx-auto">
            Your workspace is ready. Here's what you can explore right now — everything is set up for your first real operations.
          </p>
        </div>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {QUICK_LINKS.map(({ href, icon: Icon, label, color, bg }) => (
          <a
            key={href}
            href={href}
            className="group p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 flex flex-col items-center gap-3 text-center"
          >
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <span className="text-[11px] font-black text-white/70 group-hover:text-white uppercase tracking-widest transition-colors">{label}</span>
          </a>
        ))}
      </div>

      {/* CTA */}
      <Button
        onClick={handleGoToDashboard}
        disabled={isPending}
        className="w-full h-16 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-black text-base uppercase tracking-widest shadow-[0_15px_40px_rgba(124,58,237,0.4)] transition-all active:scale-95"
      >
        {isPending
          ? <Loader2 className="w-6 h-6 animate-spin" />
          : <><Sparkles className="mr-2 w-5 h-5" /> Enter Your Dashboard <ArrowRight className="ml-2 w-5 h-5" /></>
        }
      </Button>

      <p className="text-center text-[10px] text-muted-foreground/40 font-medium">
        You can return to this setup checklist any time from Settings → Getting Started.
      </p>
    </div>
  );
}
