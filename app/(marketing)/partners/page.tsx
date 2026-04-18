import React from "react";
import Link from "next/link";
import { Handshake, Rocket, DollarSign, ArrowRight, BarChart3, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PartnersLandingPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.1),transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Handshake className="w-3.5 h-3.5" />
            Nexus Partner Network
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 uppercase italic animate-in fade-in slide-in-from-bottom-8 duration-700">
            Build Your Own <br />
            <span className="text-primary drop-shadow-[0_0_15px_rgba(124,58,237,0.4)] text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-500">ERP Reseller</span> Empire
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg md:text-xl mb-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            Partner with the world's most beautiful cloud ERP. Refer your clients, 
            earn significant recurring commissions, and help businesses digitize.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 font-bold group shadow-xl shadow-primary/20">
              Apply to Partner <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Link href="/auth/signin" className="px-8 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 font-bold transition-all">
              Partner Login
            </Link>
          </div>
        </div>
      </section>

      {/* Program Benefits */}
      <section className="py-24 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 ring-1 ring-primary/30 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">20% Recurring Share</h3>
              <p className="text-muted-foreground leading-relaxed">
                Earn a generous 20% recurring commission on every subscription payment for the entire life of the customer.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 ring-1 ring-blue-500/30 group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Priority Support</h3>
              <p className="text-muted-foreground leading-relaxed">
                As a certified partner, you get direct access to our core engineering team to help you close complex enterprise deals.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-rose-500/30 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-6 ring-1 ring-rose-500/30 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Dedicated Dashboard</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track every click, trial, and conversion with our real-time partner dashboard designed for high-growth resellers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Methodology */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white mb-16">
            Everything you need <br />
            <span className="text-muted-foreground">To Succeed</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
             <div className="flex gap-6 items-start">
                <div className="mt-1 flex-shrink-0"><Globe className="w-6 h-6 text-primary" /></div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2 uppercase">Custom Partner Links</h4>
                  <p className="text-muted-foreground leading-relaxed">Generate unique codes and vanity URLs that automatically attribute every sign-up to your account via our persistent tracking engine.</p>
                </div>
             </div>
             <div className="flex gap-6 items-start">
                <div className="mt-1 flex-shrink-0"><Shield className="w-6 h-6 text-primary" /></div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2 uppercase">Payout Reliability</h4>
                  <p className="text-muted-foreground leading-relaxed">Transparent tracking and scheduled monthly payouts ensure you are always paid on time for your valuable business development work.</p>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
