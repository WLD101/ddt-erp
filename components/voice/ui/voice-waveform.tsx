"use client";

import { cn } from "@/lib/utils";

export function VoiceWaveform({ className, active = false }: { className?: string; active?: boolean }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            "w-[2px] rounded-full bg-current transition-all duration-300",
            active ? "animate-pulse" : "opacity-30"
          )}
          style={{
            height: active ? `${Math.max(4, Math.random() * 16)}px` : "4px",
            animationDelay: `${i * 100}ms`,
            animationDuration: "800ms",
          }}
        />
      ))}
    </div>
  );
}
