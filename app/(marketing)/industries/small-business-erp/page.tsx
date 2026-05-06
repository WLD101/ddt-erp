import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { FeatureGrid } from "@/components/marketing/seo/FeatureGrid";
import { FaqSection } from "@/components/marketing/seo/FaqSection";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { DollarSign, Shield, Smartphone, ArrowUpRight, CheckCircle2, Box } from "lucide-react";

export const metadata: Metadata = {
  title: "Cloud ERP Software for Small Businesses | WhatsQuery",
  description: "The perfect all-in-one inventory and sales operating system designed specifically to help small businesses scale without the enterprise price tag.",
  alternates: {
    canonical: "https://whatsquery.example.com/industries/small-business-erp",
  }
};

const FEATURES = [
  { title: "Affordable Scaling", description: "Start on our generous free tier and only upgrade your infrastructure as your headcount and catalog size demands it.", icon: DollarSign },
  { title: "Enterprise Grade Security", description: "Enjoy the exact same cryptographic tenant isolation and automated audit logging that large corporations rely on.", icon: Shield },
  { title: "Cloud Accessibility", description: "Ditch the back-office server. Access your financial metrics securely from any web-enabled device globally.", icon: Smartphone },
  { title: "Unified Platform", description: "Stop paying for disjointed accounting, inventory, and invoicing apps. WhatsQuery brings them together in one SME-friendly system.", icon: Box },
  { title: "Intuitive Design", description: "A system built for actual humans. Get your first employee trained and selling in under 15 minutes.", icon: CheckCircle2 },
  { title: "Growth Analytics", description: "Leverage advanced margin calculators to figure out exactly which products you should be restocking.", icon: ArrowUpRight },
];

const FAQS = [
  { question: "Is my data locked to your platform?", answer: "Never. We believe your data is yours. You can instantly export all inventory, sales, and client lists to raw CSV formats at any time." },
  { question: "How long does setup take?", answer: "Minutes. Create an account, dial in your local currency and tax rates, add a product, and you are immediately ready to invoice." },
];

export default function SmallBusinessPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Small Business"
        headline="Enterprise Power. Small Business Agility."
        subheadline="You've outgrown spreadsheets. Upgrade your operations with an integrated Cloud ERP that manages your cash, stock, and sales automatically."
      />
      <FeatureGrid features={FEATURES} headline="Why Small Businesses Choose Us" />
      <FaqSection faqs={FAQS} />
      <CtaBanner headline="Ready to modernize your operations?" subheadline="Deploy a complete business operating system risk-free."/>
    </div>
  );
}
