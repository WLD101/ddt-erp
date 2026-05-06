import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Manufacturing ERP | WhatsQuery",
  description: "Manufacturing workflows are not part of the current WhatsQuery Phase 1 offering.",
};

export default function ManufacturingIndustryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Coming Soon"
        headline="Manufacturing is not part of our Phase 1 launch."
        subheadline="WhatsQuery is currently built for trading, wholesale, retail, distribution, ecommerce, and basic service invoicing. Manufacturing workflows are planned for a later phase."
      />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-8 text-white">
          <Badge variant="outline" className="border-primary/30 text-primary">Phase 2 Candidate</Badge>
          <p className="mt-4 text-lg text-white/75">
            If you need BOMs, work orders, production planning, shop-floor controls, or factory automation, please contact WhatsQuery for roadmap discussion instead of using the current demo as a manufacturing promise.
          </p>
        </div>
      </div>
      <CtaBanner headline="Need a Phase 1 fit today?" subheadline="Explore how WhatsQuery supports trading, wholesale, retail, and ecommerce SMEs right now."/>
    </div>
  );
}
