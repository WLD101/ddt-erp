import React from "react";
import { DemoRequestForm } from "@/components/marketing/lead-forms";
import { PlayCircle, ShieldCheck, Zap, Globe } from "lucide-react";

export default function BookDemoPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <section className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Side: Pitch */}
          <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest leading-none">
                    <PlayCircle className="w-3.5 h-3.5" /> Book a Personalized Walkthrough
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-[0.9]">
                    See Nexus <br />
                    <span className="text-primary">In Action</span>
                </h1>
                <p className="text-muted-foreground text-xl leading-relaxed max-w-lg">
                    Discover how our cloud-native architecture can eliminate your inventory bottlenecks 
                    and streamline your global treasury in just 30 minutes.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <h4 className="text-white font-bold uppercase text-xs tracking-widest">No Commitment</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">Experience the full power of the platform without sharing payment details.</p>
                </div>
                <div className="space-y-3">
                    <Zap className="w-6 h-6 text-amber-400" />
                    <h4 className="text-white font-bold uppercase text-xs tracking-widest">Expert Led</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">Speak directly with an engineer who understands your business niche.</p>
                </div>
                <div className="space-y-3">
                    <Globe className="w-6 h-6 text-blue-400" />
                    <h4 className="text-white font-bold uppercase text-xs tracking-widest">Scale Ready</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">See how we handle multi-country, multi-branch, and multi-currency operations.</p>
                </div>
            </div>
          </div>

          {/* Right Side: High-Intent Form */}
          <div className="bg-black/60 border border-primary/20 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_0_50px_rgba(var(--primary),0.1)] relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700">
             <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Schedule Your Consultation</h3>
                <DemoRequestForm />
             </div>
          </div>

        </div>
      </section>
    </div>
  );
}
