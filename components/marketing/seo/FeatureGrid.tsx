import React from "react";
import { LucideIcon } from "lucide-react";

export interface FeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function FeatureGrid({ features, headline = "Core Platform Capabilities" }: { features: FeatureItem[], headline?: string }) {
  return (
    <section className="px-6 py-24 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">{headline}</h2>
        <div className="w-20 h-1 bg-primary mx-auto rounded-full opacity-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <div 
            key={i}
            className="group p-8 rounded-3xl bg-black/20 border border-white/5 hover:bg-white/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Hover flare */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-white group-hover:text-primary transition-colors" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
