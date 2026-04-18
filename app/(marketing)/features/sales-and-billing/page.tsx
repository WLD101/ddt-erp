import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { FeatureGrid } from "@/components/marketing/seo/FeatureGrid";
import { FaqSection } from "@/components/marketing/seo/FaqSection";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { ShoppingCart, FileText, RefreshCcw, CreditCard, PieChart, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Sales & Invoicing Software | NexusERP",
  description: "Accelerate checkout, automate B2B invoicing, and manage customer credit flawlessly with the NexusERP Sales engine.",
  alternates: {
    canonical: "https://nexuserp.com/features/sales-and-billing",
  }
};

const FEATURES = [
  { title: "Point of Sale (POS)", description: "A lightning-fast checkout interface designed for cashiers to process walk-in retail transactions effortlessly.", icon: ShoppingCart },
  { title: "B2B Invoicing", description: "Generate professional PDF invoices with multi-line items, regional tax assignments, and precise payment terms.", icon: FileText },
  { title: "Returns Management", description: "Process partial or full returns dynamically, restocking items and creating auditable credit notes automatically.", icon: RefreshCcw },
  { title: "Partial Payments", description: "Allow clients to pay in installments. Track outstanding balances and outstanding receivables easily.", icon: CreditCard },
  { title: "Customer Ledger", description: "Maintain a complete financial and behavioral history for every client purchasing from your business.", icon: Users },
  { title: "Margin Analytics", description: "View real-time gross profit overlays on every invoice before you approve it to ensure profitability.", icon: PieChart },
];

const FAQS = [
  { question: "Can I customize the invoice design?", answer: "Yes. Your business profile (name, address, tax IDs) and custom uploaded logic is fundamentally stamped onto all generated PDFs." },
  { question: "How do partial payments work?", answer: "When processing a $1,000 invoice, you can record a $200 cash payment today. The invoice instantly moves to 'Partially Paid' and updates your Accounts Receivable dashboard." },
  { question: "Does the POS work offline?", answer: "Currently, NexusERP is a cloud-native platform requiring an active internet connection to ensure your inventory remains perfectly synced globally." },
];

export default function SalesFeaturePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Sales & Invoicing"
        headline="Get Paid Faster. Look Professional."
        subheadline="From high-speed retail checkout to complex B2B invoice generation, our sales module handles your revenue intelligently."
      />
      <FeatureGrid features={FEATURES} headline="Sales Capabilities" />
      <FaqSection faqs={FAQS} />
      <CtaBanner headline="Start billing your customers today." />
    </div>
  );
}
