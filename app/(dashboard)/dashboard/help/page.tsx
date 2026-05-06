import React from "react";
import { QUICK_GUIDES, FAQS } from "@/lib/help-content";
import { SupportForm } from "@/components/help/SupportForm";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

export default function HelpCenterPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* HEADER & SEARCH */}
      <div className="text-center space-y-8 py-16">
        <div className="mx-auto bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-soft border border-primary/20">
          <span className="material-symbols-outlined text-primary text-[40px]">live_help</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface font-headline-md uppercase">
          Empower your <span className="text-primary">Operations</span>
        </h1>
        <div className="max-w-2xl mx-auto relative group mt-4">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors">search</span>
          <Input 
            placeholder="Search for articles, system guides, or feature maps..." 
            className="w-full h-16 pl-14 pr-4 rounded-3xl bg-surface border border-outline-variant/30 text-lg text-on-surface shadow-soft focus:border-primary/50 transition-all hover:bg-surface-container-low/20"
          />
        </div>
      </div>

      {/* QUICK GUIDES VS SUPPORT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Quick Guides (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary text-[24px]">rocket_launch</span>
            <h2 className="text-sm font-black text-on-surface tracking-[0.2em] uppercase">Intelligence Onboarding</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {QUICK_GUIDES.map((guide) => (
              <Card key={guide.id} className="rounded-3xl border border-outline-variant/30 bg-surface hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer group shadow-soft">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                      {guide.readTime} ANALYTICS
                    </span>
                  </div>
                  <CardTitle className="text-lg font-black text-on-surface leading-tight mt-4 group-hover:text-primary transition-colors font-headline-sm">{guide.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-on-surface-variant leading-relaxed line-clamp-3 italic">
                    "{guide.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-10">
            <h2 className="text-sm font-black text-on-surface tracking-[0.2em] uppercase mb-8">Base Knowledge Matrix</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {FAQS.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border border-outline-variant/30 bg-surface rounded-2xl px-6 data-[state=open]:border-primary/30 data-[state=open]:shadow-soft transition-all">
                  <AccordionTrigger className="text-left font-black text-sm text-on-surface hover:text-primary py-5 hover:no-underline font-headline-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-on-surface-variant text-sm font-medium leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            <SupportForm />
            
            <Card className="rounded-3xl bg-secondary/5 border-secondary/10 p-6 text-center shadow-soft">
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4">Enterprise Triage</h3>
              <p className="text-xs font-medium text-on-surface-variant leading-relaxed mb-6">
                Premium deployment support guarantees a 1-hour SLA response window across all prioritized channels.
              </p>
              <div className="py-3 px-4 bg-surface/50 rounded-xl border border-secondary/20 text-[10px] font-black text-secondary uppercase tracking-widest italic">
                Node Status: Active
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}

