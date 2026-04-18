import React from "react";
import { HELP_CATEGORIES, QUICK_GUIDES, FAQS } from "@/lib/help-content";
import { SupportForm } from "@/components/help/SupportForm";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Flame, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function HelpCenterPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* HEADER & SEARCH */}
      <div className="text-center space-y-6 py-12">
        <div className="mx-auto bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ring-2 ring-primary/30 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
          How can we <span className="text-primary hover:text-white transition-colors duration-500">help you?</span>
        </h1>
        <div className="max-w-2xl mx-auto relative group mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search for articles, guides, or features..." 
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-black/20 border-white/10 text-lg text-white shadow-xl focus:border-primary/50 transition-all hover:bg-black/30 placeholder:font-light"
          />
        </div>
      </div>

      {/* QUICK GUIDES VS SUPPORT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Guides (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white tracking-widest uppercase">Quick Start Guides</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUICK_GUIDES.map((guide) => (
              <Card key={guide.id} className="border border-white/5 bg-black/20 backdrop-blur-md hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      {guide.readTime} Read
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-white leading-tight mt-3 group-hover:text-primary transition-colors">{guide.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {guide.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-8">
            <h2 className="text-xl font-black text-white tracking-widest uppercase mb-4">Common Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {FAQS.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border border-white/5 bg-black/20 rounded-xl px-4 data-[state=open]:border-primary/30 data-[state=open]:bg-white/5 transition-all">
                  <AccordionTrigger className="text-left font-semibold text-sm hover:text-primary py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <SupportForm />
            
            <div className="mt-8 border border-white/5 bg-white/[0.02] rounded-xl p-6 text-center space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Enterprise Support</h3>
              <p className="text-xs text-muted-foreground">Premium deployment support is guaranteed a 1-hour SLA response time across multiple channels.</p>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-xs text-white/70 italic">
                SLA active for Enterprise clients.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
