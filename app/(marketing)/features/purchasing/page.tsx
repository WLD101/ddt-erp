import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { FeatureGrid } from "@/components/marketing/seo/FeatureGrid";
import { FaqSection } from "@/components/marketing/seo/FaqSection";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { Truck, FileArchive, PackageOpen, Undo2, Building, Calculator } from "lucide-react";

export const metadata: Metadata = {
  title: "Purchase Order & Supplier Management | WhatsQuery",
  description: "Manage suppliers, automate purchase orders, and track your accounts payable seamlessly with WhatsQuery.",
  alternates: {
    canonical: "https://whatsquery.example.com/features/purchasing",
  }
};

const FEATURES = [
  { title: "Supplier Profiles", description: "Keep a centralized database of vendors, complete with financial history and contact details.", icon: Building },
  { title: "Purchase Intake", description: "Receive inventory rapidly. Processing an invoice automatically updates total branch stock levels.", icon: PackageOpen },
  { title: "Accounts Payable", description: "Track outstanding supplier balances. Set due dates and manage your cash flow effectively.", icon: Calculator },
  { title: "Supplier Returns", description: "Process outward returns back to manufacturers, adjusting your COGS and stock tallies transparently.", icon: Undo2 },
  { title: "Expense Tracking", description: "Log operational expenses alongside COGS purchases to get a holistic view of outgoing cash.", icon: FileArchive },
  { title: "Delivery Status", description: "Mark purchases as 'Pending' or 'Delivered' to forecast incoming stock availability.", icon: Truck },
];

const FAQS = [
  { question: "How are average costs updated?", answer: "Each time you log a Purchase Invoice, the system evaluates the new quantity and the price paid to generate a new moving average Cost of Goods for that exact product." },
  { question: "Can I log non-inventory expenses?", answer: "Yes, our dedicated Expenses module allows you to track rent, payroll, and utilities separately from inventory purchases." },
];

export default function PurchasingFeaturePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Supply Chain"
        headline="Procurement Made Simple."
        subheadline="Take the guesswork out of ordering. Track supplier relationships, intake inventory safely, and manage Accounts Payable from one unified dashboard."
      />
      <FeatureGrid features={FEATURES} headline="Procurement Capabilities" />
      <FaqSection faqs={FAQS} />
      <CtaBanner headline="Ready to secure your supply chain?" />
    </div>
  );
}
