import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { shouldShowOnboarding } from "@/modules/onboarding/actions";

const industries = [
  {
    id: "trading-wholesale",
    title: "Trading & Wholesale",
    description: "Manage customers, suppliers, products, purchases, and sales invoices for growing SMEs.",
    icon: "inventory_2",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    id: "ecommerce",
    title: "Ecommerce",
    description: "Sync products, inventory, and orders across Daraz, Shopify, WooCommerce, and CSV imports.",
    icon: "storefront",
    color: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/30",
  },
  {
    id: "retail-distribution",
    title: "Retail & Distribution",
    description: "Track branch stock, low-stock alerts, daily billing, and light distribution operations.",
    icon: "local_shipping",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
  },
];

export default async function MarketingHomePage() {
  const session = await auth();
  if (session?.user?.id) {
  if (session?.user?.id) {
    if (session.user.email && isPlatformAdminEmail(session.user.email)) {
      return (
        <div className="flex flex-col w-full bg-surface-container-lowest">
          <section className="relative pt-32 pb-20 px-6 overflow-hidden">
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-black tracking-[0.25em] uppercase text-primary mb-10 backdrop-blur-md">
                Public Site
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-on-surface leading-[0.9] mb-8">
                WhatsQuery for <br />
                <span className="text-primary italic">Modern Operators</span>
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
                You are signed in as a platform admin, but public pages remain available normally.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/pricing">
                  <Button variant="outline" className="h-14 px-10 text-xs font-black uppercase tracking-widest rounded-2xl border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low transition-all shadow-sm">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      );
    }
    const isEligible = await shouldShowOnboarding();
    if (isEligible) {
      redirect("/onboarding");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[160px] opacity-50 animate-pulse" />
          <div className="absolute bottom-0 right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[160px] opacity-40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-black tracking-[0.25em] uppercase text-primary mb-10 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            AI-Ready Cloud ERP For Fast-Moving Teams
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-on-surface leading-[0.85] mb-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            ENGINEERED FOR <br />
            <span className="text-primary italic">HYPER-GROWTH.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-on-surface-variant max-w-3xl mx-auto leading-relaxed mb-14 font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            WhatsQuery is built for trading, wholesale, retail, distribution, and ecommerce SMEs that need one place for stock, purchases, sales, expenses, and channel sync.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <Link href="/auth/signup">
              <Button className="h-16 px-12 text-sm font-black uppercase tracking-widest rounded-2xl bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="h-16 px-12 text-sm font-black uppercase tracking-widest rounded-2xl border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low shadow-soft transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3">
                <Play className="h-4 w-4 fill-current" />
                Watch Demo
              </Button>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-24 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale transition-all hover:grayscale-0 animate-in fade-in duration-1000 delay-500">
             <div className="flex items-center gap-2 font-black tracking-tighter text-2xl italic text-on-surface">TRUSTED <span className="text-primary">BY</span> 500+ <span className="text-primary">BRANDS</span></div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="relative py-32 px-6 border-y border-outline-variant/10 bg-surface">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary),0.03),transparent_40%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mb-20">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[2px] w-12 bg-primary" />
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Vertical Power</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              One platform. <br />
              <span className="text-on-surface-variant">Tailored for your industry.</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {industries.map((industry, index) => (
              <div 
                key={industry.id}
                className={`group relative p-10 rounded-[2.5rem] border border-outline-variant/30 bg-surface shadow-soft hover:shadow-hover transition-all duration-500 hover:-translate-y-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-backwards`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Subtle background gradient effect */}
                <div className={`absolute inset-0 rounded-[2.5rem] bg-gradient-to-br ${industry.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`} />
                
                <div className="relative z-10">
                  <div className="mb-10 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-surface border border-outline-variant/40 shadow-soft group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500">
                    <span className="material-symbols-outlined text-4xl text-on-surface group-hover:text-primary transition-colors">
                      {industry.icon}
                    </span>
                  </div>
                  
                  <h4 className="text-3xl font-black text-on-surface mb-4 tracking-tight">{industry.title}</h4>
                  <p className="text-base font-medium text-on-surface-variant leading-relaxed mb-10 group-hover:text-on-surface transition-colors">
                    {industry.description}
                  </p>
                  
                  <Link href={`/auth/signup?industry=${industry.id}`} className="block w-full">
                    <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-surface border border-outline-variant text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-300 active:scale-95 shadow-sm">
                      Start Setup
                      <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>

                {/* Decorative element */}
                <div className="absolute top-8 right-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none text-on-surface">
                  <span className="material-symbols-outlined text-8xl">
                    {industry.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-28 px-6 bg-surface-container-lowest relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.02),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
           {[
             { label: "Active Users", value: "10K+" },
             { label: "Branches Managed", value: "2.5K" },
             { label: "Daily Transactions", value: "50K+" },
             { label: "Uptime SLA", value: "99.9%" }
           ].map((stat, i) => (
             <div key={i} className="text-center p-10 rounded-[2rem] bg-surface border border-outline-variant/20 shadow-soft">
                <p className="text-4xl md:text-5xl font-black text-on-surface mb-2 tracking-tighter">{stat.value}</p>
                <p className="text-[11px] font-black uppercase tracking-widest text-primary/70">{stat.label}</p>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
