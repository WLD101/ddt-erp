import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { FeatureGrid } from "@/components/marketing/seo/FeatureGrid";
import { FaqSection } from "@/components/marketing/seo/FaqSection";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { LineChart, Wallet, Vault, ArrowRightLeft, Target, ScrollText } from "lucide-react";

export const metadata: Metadata = {
  title: "ERP Financial Reports & Analytics | WhatsQuery",
  description: "Gain deep insights into your business profitability. Track cash flow, product margins, and ledger balances dynamically.",
  alternates: {
    canonical: "https://whatsquery.example.com/features/financial-reports",
  }
};

const FEATURES = [
  { title: "Real-Time Profitability", description: "Instantly see Gross Profit and Net Profit margins factoring in moving average COGS and live expenses.", icon: LineChart },
  { title: "Account Ledgers", description: "Map out your Cash and Bank accounts. Review every transaction moving in and out of your business.", icon: ScrollText },
  { title: "Cash Flow Tracking", description: "Distinguish between 'earned' revenue (invoices) and actual 'collected' revenue (payments).", icon: Wallet },
  { title: "Bank Transfers", description: "Seamlessly log internal movements of capital between cash registers and bank accounts.", icon: ArrowRightLeft },
  { title: "Safe & Vault Management", description: "Keep strict tallies on held cash internally across distinct physical operational branches.", icon: Vault },
  { title: "Goal Analytics", description: "Identify your most profitable customers, highest turning products, and seasonal trends instantly.", icon: Target },
];

const FAQS = [
  { question: "Do I need to be an accountant to use this?", answer: "Not at all. WhatsQuery abstracts complex double-entry mechanics into easy-to-read, visually rich dashboards designed for business owners." },
  { question: "Can I manage multiple bank accounts?", answer: "Yes. You can create unlimited discrete Financial Accounts (e.g. 'Main Checking', 'Store 1 Register', 'Petty Cash') and assign payments strictly to them." },
  { question: "Is data exportable?", answer: "Absolutely. All ledger histories and profit tables can be exported cleanly to standard spreadsheet formats for your CPA." },
];

export default function FinancialFeaturePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Advanced Reporting"
        headline="Financial Truth At Your Fingertips."
        subheadline="Stop relying on gut feelings. Uncover exactly where your capital is locked up and which products are driving your true profit margins."
      />
      <FeatureGrid features={FEATURES} headline="Financial Capabilities" />
      <FaqSection faqs={FAQS} />
      <CtaBanner headline="Ready to uncover your true profit?" />
    </div>
  );
}
