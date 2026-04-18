import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { FeatureGrid } from "@/components/marketing/seo/FeatureGrid";
import { FaqSection } from "@/components/marketing/seo/FaqSection";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { MonitorPlay, Tag, Store, QrCode, Banknote, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Retail POS & Inventory Management | NexusERP",
  description: "Equip your cashiers with a lightning fast POS while your back-office perfectly tracks store-level stock metrics using NexusERP.",
  alternates: {
    canonical: "https://nexuserp.com/industries/retail-erp",
  }
};

const FEATURES = [
  { title: "Rapid POS Checkout", description: "An uncluttered interface optimized exclusively for fast, across-the-counter retail transactions.", icon: MonitorPlay },
  { title: "Store-Level Segregation", description: "Each retail storefront operates individually. Track isolated profitability and hyper-local stock limits.", icon: Store },
  { title: "Cash Drawer Tracking", description: "Assign specific cash accounts to each register so you know exactly every single penny flowing daily.", icon: Banknote },
  { title: "Variant Support", description: "Process clothing and apparel natively. Assign multiple colors and sizes under unified product families.", icon: Tag },
  { title: "Barcode Input Support", description: "Any standard bluetooth/USB barcode scanner instantly acts as a rapid input mechanism on the POS screen.", icon: QrCode },
  { title: "Theft Prevention", description: "Prevent arbitrary stock adjustments through strict role-based capability boundaries and immutable audit logs.", icon: ShieldAlert },
];

const FAQS = [
  { question: "Can I limit cashiers to certain tasks?", answer: "Yes! Utilizing our standard RBAC system, you can lock a 'Cashier' role out of editing product costs, adjusting inventory, or accessing advanced profit metrics." },
  { question: "How does multi-store tracking work?", answer: "Every physical location is established as a 'Branch'. When viewing inventory from the HQ, you will see '15 in Store A' and '10 in Store B' independently." },
];

export default function RetailPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Retail Ecosystem"
        headline="Move The Line. Master The Stock."
        subheadline="An ERP that is just as fast at the front counter as it is intelligent returning data down to the back office."
      />
      <FeatureGrid features={FEATURES} headline="Perfected for Modern Retailers" />
      <FaqSection faqs={FAQS} />
      <CtaBanner headline="Ready to open your next location?" />
    </div>
  );
}
