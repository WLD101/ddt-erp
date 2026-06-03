import { cn } from "@/lib/utils";

export type VoiceStatusVariant = "online" | "offline" | "warning" | "default" | "error";

interface VoiceStatusPillProps {
  variant: VoiceStatusVariant;
  label: string;
  className?: string;
  pulse?: boolean;
}

export function VoiceStatusPill({ variant, label, className, pulse }: VoiceStatusPillProps) {
  const variants = {
    online: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    offline: "bg-slate-800/50 text-slate-400 border-slate-700/50",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    default: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  const pulseColors = {
    online: "bg-emerald-400",
    offline: "bg-slate-500",
    warning: "bg-amber-400",
    error: "bg-rose-400",
    default: "bg-cyan-400",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em]",
        variants[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", pulseColors[variant])}></span>
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", pulseColors[variant])}></span>
        </span>
      )}
      {label}
    </div>
  );
}
