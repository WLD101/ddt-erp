import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { FeatureGrid } from "@/components/marketing/seo/FeatureGrid";
import { FaqSection } from "@/components/marketing/seo/FaqSection";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { Warehouse, Truck, Users2, FileArchive, RefreshCw, HandCoins } from "lucide-react";

export const metadata: Metadata = {
  title: "B2B Wholesale Cloud ERP System | NexusERP",
  description: "Drive your B2B wholesale distribution business. Manage massive catalogs, complex pricing tiers, and intensive accounts receivables cleanly.",
  alternates: {
    canonical: "https://nexuserp.com/industries/wholesale-erp",
  }
};

const FEATURES = [
  { title: "B2B Accounts Receivable", description: "Monitor aging balances, enforce client credit limits, and accept partial chunk payments against massive invoices.", icon: HandCoins },
  { title: "Multi-Warehouse Routing", description: "Establish standalone warehouses internally. Fulfill specific invoices directly from specific local storage sites.", icon: Warehouse },
  { title: "Client Quotations", description: "Generate rapid proforma invoices and professional PDF quotations tailored for bulk buyers.", icon: FileArchive },
  { title: "Bulk Intake Operations", description: "Process heavy POs rapidly. Intaking a shipment instantly recalculates active COGS models system-wide.", icon: Truck },
  { title: "Wholesaler Margins", description: "Protect your razor-thin B2B margins by viewing proactive Gross Profit percentages on every drafted invoice.", icon: Users2 },
  { title: "RMA & Returns Tracking", description: "Manage both inward customer returns and outward supplier rejections seamlessly without manual accounting.", icon: RefreshCw },
];

const FAQS = [
  { question: "Our catalog has thousands of SKUs, can it handle that?", answer: "Yes, our database architecture natively scales to manage hundreds of thousands of individual products. Our enterprise tier allows up to 1,000,000 SKUs." },
  { question: "How do you handle B2B installment payments?", answer: "We treat each invoice as an independent ledger. Clients can pay $5,000 today against a $50,000 invoice, automatically updating your Accounts Receivable Dashboard." },
];

export default function WholesalePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Wholesale Distribution"
        headline="Run complex B2B pipelines cleanly."
        subheadline="Your logistics shouldn't be chaotic. Master your inventory, establish firm customer credit controls, and fulfill large-scale orders with military precision."
      />
      <FeatureGrid features={FEATURES} headline="Built for High-Volume Distributors" />
      <FaqSection faqs={FAQS} />
      <CtaBanner headline="Ready to modernize your distribution backend?" />
    </div>
  );
}
