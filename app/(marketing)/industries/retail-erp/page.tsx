import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { FeatureGrid } from "@/components/marketing/seo/FeatureGrid";
import { FaqSection } from "@/components/marketing/seo/FaqSection";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { MonitorPlay, Tag, Store, QrCode, Banknote, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Retail Back-Office ERP | WhatsQuery",
  description: "Manage store inventory, purchases, customer billing, and reports with a retail back-office ERP for modern retail teams.",
  alternates: {
    canonical: "https://whatsquery.example.com/industries/retail-erp",
  }
};

const FEATURES = [
  { title: "Fast Sales Billing", description: "Create customer invoices quickly while your back-office remains aligned with current stock and expenses.", icon: MonitorPlay },
  { title: "Store-Level Segregation", description: "Each retail storefront operates individually. Track isolated profitability and hyper-local stock limits.", icon: Store },
  { title: "Cash Drawer Tracking", description: "Assign specific cash accounts to each register so you know exactly every single penny flowing daily.", icon: Banknote },
  { title: "Variant Support", description: "Process clothing and apparel natively. Assign multiple colors and sizes under unified product families.", icon: Tag },
  { title: "Barcode-Friendly Catalog", description: "Keep SKUs and product records organized so store teams can work faster with existing barcode processes.", icon: QrCode },
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
        headline="Run retail back-office operations with confidence."
        subheadline="WhatsQuery helps retailers manage stock, supplier purchases, billing, and reporting without spreadsheet chaos."
      />
      <FeatureGrid features={FEATURES} headline="Perfected for Modern Retailers" />
      <FaqSection faqs={FAQS} />
      <CtaBanner headline="Ready to open your next location?" />
    </div>
  );
}
