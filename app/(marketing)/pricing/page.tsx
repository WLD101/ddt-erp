import React from "react";
import Link from "next/link";
import { Check, ArrowRight, Zap, Target, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const plans = [
    {
      name: "SME Starter",
      price: "49",
      description: "Perfect for single-branch businesses and entrepreneurs.",
      features: ["Up to 3 Users", "Single Branch", "Inventory Tracking", "Sales Invoicing", "Basic Reports"],
      cta: "Start Free Trial",
      href: "/auth/signup",
      highlight: false
    },
    {
      name: "Business Pro",
      price: "149",
      description: "The complete operating system for growing wholesalers and retailers.",
      features: ["Unlimited Users", "Multiple Branches", "Advanced Analytics", "Supplier Management", "Financial Ledger", "Priority Support"],
      cta: "Start Free Trial",
      href: "/auth/signup",
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored solutions for large-scale operations and manufacturing.",
      features: ["Custom Integrations", "Dedicated Manager", "On-Premise Options", "Advanced Permissions", "Audit History", "SLA Guarantee"],
      cta: "Contact Sales",
      href: "/contact",
      highlight: false
    }
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Hero */}
      <section className="pt-24 pb-16 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Simple, Transparent <br />
            <span className="text-primary italic">Pricing</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            No hidden fees. No setup costs. Choose the plan that scales with your ambition.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-32 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div 
              key={plan.name} 
              className={`p-8 rounded-3xl border flex flex-col items-start transition-all duration-300 hover:-translate-y-2 ${
                plan.highlight 
                  ? "bg-white/[0.03] border-primary/50 shadow-2xl shadow-primary/10 ring-1 ring-primary/20 scale-105" 
                  : "bg-black/40 border-white/5 shadow-xl hover:border-white/10"
              } animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-backwards`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {plan.highlight && (
                <div className="px-3 py-1 bg-primary text-[10px] font-black uppercase tracking-widest rounded-full text-white mb-6">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-white">{plan.price !== "Custom" && "$"}{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-muted-foreground font-medium text-sm">/mo</span>}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                {plan.description}
              </p>
              
              <div className="space-y-4 mb-10 w-full flex-1">
                {plan.features.map(feature => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-white/80">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary font-bold" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>

              <Link href={plan.href} className="w-full">
                <Button 
                  className={`w-full h-12 rounded-xl font-bold uppercase tracking-tight group ${
                    plan.highlight 
                      ? "bg-primary hover:bg-primary/90 text-white" 
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  }`} 
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {plan.cta} <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Demo CTA Section */}
      <section className="py-24 bg-primary/5 border-y border-white/5 mb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic mb-6">
              Need more <span className="text-primary italic">Complexity?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              If your business handles thousands of SKUs, complex manufacturing, or requires a custom deployment, 
              talk to our solution engineers today.
            </p>
            <div className="flex flex-wrap gap-4">
               <div className="flex items-center gap-2 text-sm text-white/60">
                  <Zap className="w-4 h-4 text-primary" /> Multi-country Deployment
               </div>
               <div className="flex items-center gap-2 text-sm text-white/60">
                  <Target className="w-4 h-4 text-primary" /> Custom Business Logic
               </div>
               <div className="flex items-center gap-2 text-sm text-white/60">
                  <Rocket className="w-4 h-4 text-primary" /> White-label Options
               </div>
            </div>
          </div>
          <div className="shrink-0">
             <Link href="/book-demo">
                <Button size="lg" className="rounded-full px-12 h-16 text-xl font-black bg-white text-black hover:bg-white/90 shadow-2xl">
                  Watch a Demo
                </Button>
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
