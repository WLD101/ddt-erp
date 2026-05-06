import React from "react";
import { DemoButton } from "@/components/marketing/DemoButton";
import { ChevronRight } from "lucide-react";

interface SeoHeroProps {
  headline: string;
  subheadline: string;
  badge?: string;
  primaryCtaText?: string;
}

export function SeoHero({ headline, subheadline, badge, primaryCtaText = "Explore Interactive Demo" }: SeoHeroProps) {
  return (
    <section className="relative px-6 py-24 md:py-32 lg:py-40 flex flex-col items-center justify-center text-center overflow-hidden border-b border-white/5">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fade-in-0 flex flex-col items-center">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase text-primary mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {badge}
          </div>
        )}
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[1.1]">
          {headline}
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {subheadline}
        </p>
        
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <DemoButton className="w-full sm:w-auto h-14 px-8 text-base shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] group" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold hidden sm:block">Or <a href="/auth/signup" className="text-white hover:text-primary transition-colors hover:underline">Start From Scratch <ChevronRight className="inline w-3 h-3" /></a></p>
        </div>
      </div>
    </section>
  );
}
