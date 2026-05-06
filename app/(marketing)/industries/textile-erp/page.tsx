import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Textile ERP | WhatsQuery",
  description: "Textile production workflows are not part of the current WhatsQuery Phase 1 offering.",
};

export default function TextileIndustryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Coming Soon"
        headline="Textile production is not part of our Phase 1 launch."
        subheadline="WhatsQuery is currently focused on trading, wholesale, retail, distribution, ecommerce, and basic service invoicing. Textile manufacturing workflows come later."
      />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-8 text-white">
          <Badge variant="outline" className="border-primary/30 text-primary">Phase 2 Candidate</Badge>
          <p className="mt-4 text-lg text-white/75">
            If you need rolls, dye lots, cutting, stitching, or export-manufacturing workflows, please treat that as future roadmap scope rather than current product capability.
          </p>
        </div>
      </div>
      <CtaBanner headline="Need stock and sales control today?" subheadline="WhatsQuery is ready now for trading, wholesale, retail, and ecommerce SMEs."/>
    </div>
  );
}
