import React from "react";
import { DemoButton } from "@/components/marketing/DemoButton";

export function CtaBanner({ headline = "Ready to upgrade your operations?", subheadline = "Deploy your dedicated workspace in milliseconds. No credit card required." }) {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto">
      <div className="relative rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-primary/20 to-black border border-white/10 p-10 md:p-20 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight">
            {headline}
          </h2>
          <p className="text-lg text-primary-50">
            {subheadline}
          </p>
          <div className="pt-4 flex justify-center">
            <DemoButton className="h-14 px-10 text-lg shadow-[0_0_50px_rgba(124,58,237,0.5)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
