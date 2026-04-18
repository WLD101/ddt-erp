import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection({ faqs, headline = "Frequently Asked Questions" }: { faqs: FaqItem[], headline?: string }) {
  return (
    <section className="px-6 py-24 max-w-4xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">{headline}</h2>
        <div className="w-20 h-1 bg-primary mx-auto rounded-full opacity-50" />
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border border-white/10 bg-black/20 backdrop-blur-sm rounded-2xl px-6 data-[state=open]:border-primary/50 data-[state=open]:bg-white/5 transition-all">
            <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors py-6 hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {/* Invisible Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
