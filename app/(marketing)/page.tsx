import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { shouldShowOnboarding } from "@/modules/onboarding/actions";
import { PackageFitCalculator } from "@/components/marketing/package-fit-calculator";
import { ErpLandingClient } from "@/components/marketing/erp-landing-client";

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
      
      {/* Main Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-6">
        <div className="relative z-10 max-w-7xl mx-auto text-center flex flex-col items-center">
          
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[12px] font-medium tracking-wide text-indigo-300 mb-12">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            The Next Gen AI-ERP Is Here
          </div>

          {/* Dynamic interactive landing component */}
          <ErpLandingClient 
            trialHref="/auth/signup?mode=trial"
            demoHref="/auth/signup?mode=demo"
          />
        </div>
      </section>

      <PackageFitCalculator />

      {/* Big CTA Section */}
      <section className="relative py-24 px-6 overflow-hidden z-10">
        <div className="absolute inset-0 bg-indigo-600/10 blur-[100px] rounded-full -z-10 mx-auto w-2/3 h-2/3 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto glass-card p-12 md:p-20 rounded-[40px] text-center relative border border-indigo-500/20">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to simplify?</h2>
          <p className="text-xl text-indigo-200 mb-12 max-w-xl mx-auto">Join hundreds of high-volume merchants using WhatsQuery to run reliable ops.</p>
          <Link href="/auth/signup?mode=paid">
            <Button size="lg" className="h-16 px-12 text-lg font-bold rounded-full bg-white hover:bg-slate-100 text-slate-900 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.15)] active:scale-95">
              Launch Workspace Now
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
