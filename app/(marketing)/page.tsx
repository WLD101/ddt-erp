import React from "react";
import Link from "next/link";
import { ChevronRight, Sparkles, Rocket, BarChart3, ShieldCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { shouldShowOnboarding } from "@/modules/onboarding/actions";

export default async function MarketingHomePage() {
  const session = await auth();
  if (session?.user?.id) {
    if (session.user.email && isPlatformAdminEmail(session.user.email)) {
      // Admin flow, skip logic remains, just basic link out
    } else {
      const isEligible = await shouldShowOnboarding();
      if (isEligible) redirect("/onboarding");
      else redirect("/dashboard");
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden selection:bg-indigo-500/40 selection:text-white">
      
      {/* Main Hero Section - Starlight Layout */}
      <section className="relative pt-16 pb-24 md:pt-32 md:pb-40 px-6">
        <div className="relative z-10 max-w-7xl mx-auto text-center flex flex-col items-center">
          
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[12px] font-medium tracking-wide text-indigo-300 mb-8 reveal">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            The Next Gen AI-ERP Is Here
          </div>

          {/* Massive Heading */}
          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] text-white mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] reveal stagger-1">
            ENGINEERED FOR<br/>
            <span className="hero-gradient">HYPER-GROWTH.</span>
          </h1>

          {/* Subhead */}
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12 reveal stagger-2">
            Enterprise intelligence for retail, distribution, wholesale, and ecommerce. Centralize stock, sales, accounting, and multi-channel operations in a beautiful, unified hub.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 reveal stagger-3">
            <Link href="/auth/signup">
              <Button size="lg" className="h-14 px-10 text-base font-bold rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] border-t border-indigo-400/30 transition-all transform hover:scale-[1.03] active:scale-95 group">
                Get Started Free
                <Rocket className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="ghost" size="lg" className="h-14 px-10 text-base font-bold rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all">
                Book Platform Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Designed to scale with your infrastructure as you grow from first sale to enterprise volume.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="glass-card p-8 md:p-12 rounded-[32px] transition-all duration-500 hover:-translate-y-2 hover:border-indigo-500/30 group">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Intelligent Forecasting</h3>
              <p className="text-slate-400 leading-relaxed">
                Predict stockouts and automatically generate purchase orders based on historical velocity and seasonal spikes.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-8 md:p-12 rounded-[32px] transition-all duration-500 hover:-translate-y-2 hover:border-purple-500/30 group">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-purple-500/20 text-purple-400">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Real-Time Ledger</h3>
              <p className="text-slate-400 leading-relaxed">
                Instant reconciliation across bank accounts, credits, assets, and P&L statements with enterprise precision.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card p-8 md:p-12 rounded-[32px] transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/30 group">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-blue-500/20 text-blue-400">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Global Multi-Store</h3>
              <p className="text-slate-400 leading-relaxed">
                Central management of unlimited physical locations, warehouses, and third-party logistic providers.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Big CTA Section */}
      <section className="relative py-32 px-6 overflow-hidden z-10">
        <div className="absolute inset-0 bg-indigo-600/10 blur-[100px] rounded-full -z-10 mx-auto w-2/3 h-2/3 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto glass-card p-12 md:p-20 rounded-[40px] text-center relative border border-indigo-500/20">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to simplify?</h2>
          <p className="text-xl text-indigo-200 mb-12 max-w-xl mx-auto">Join hundreds of high-volume merchants using WhatsQuery to run reliable ops.</p>
          <Link href="/auth/signup">
            <Button size="lg" className="h-16 px-12 text-lg font-bold rounded-full bg-white hover:bg-slate-100 text-slate-900 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.15)] active:scale-95">
              Launch Workspace Now
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
