import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { FeatureGrid } from "@/components/marketing/seo/FeatureGrid";
import { FaqSection } from "@/components/marketing/seo/FaqSection";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { ClipboardCheck, FastForward, Clock, MailPlus, Settings2, Stamp } from "lucide-react";

export const metadata: Metadata = {
  title: "Quotation & Proforma Software | NexusERP",
  description: "Create professional quotes, estimate costs, and convert estimates into live sales invoices in a single click.",
  alternates: {
    canonical: "https://nexuserp.com/features/quotations",
  }
};

const FEATURES = [
  { title: "Rapid Generation", description: "Spin up complex quotations using your live inventory pricing in seconds.", icon: FastForward },
  { title: "One-Click Conversion", description: "Convert an accepted quote directly into a live Sales Invoice without manual re-entry.", icon: FastForward }, 
  { title: "Expiry Tracking", description: "Assign validity periods to your quotes so you're never held to outdated pricing agreements.", icon: Clock },
  { title: "Digital Delivery", description: "Export quotes directly to PDF formats suitable for instant email dispatch to clients.", icon: MailPlus },
  { title: "Cost Estimates", description: "View your true internal COGS alongside the quoted retail price to ensure the deal remains profitable.", icon: Settings2 },
  { title: "Approval Workflows", description: "Track the lifecycle of a quote from 'Draft' to 'Sent' to 'Accepted' securely.", icon: Stamp },
];

const FAQS = [
  { question: "Does creating a quote reserve inventory?", answer: "No. Quotations live strictly as estimates. Stock is only formally deducted once a quote is converted into an active Sales Invoice." },
  { question: "Can I edit an accepted quote?", answer: "Once accepted, quotes are generally locked to preserve audit history. You can, however, duplicate the quote to create a revised version." },
];

export default function QuotationsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Pre-Sales Workflow"
        headline="Win Clients with Professional Quotes."
        subheadline="Deliver accurate estimates faster than your competitors. Track approvals and turn a 'Yes' into a paid invoice effortlessly."
      />
      <FeatureGrid features={FEATURES} headline="Quotation Capabilities" />
      <FaqSection faqs={FAQS} />
      <CtaBanner headline="Ready to start closing more deals?" />
    </div>
  );
}
