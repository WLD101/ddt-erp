import React from "react";
import { Metadata } from "next";
import { SeoHero } from "@/components/marketing/seo/SeoHero";
import { FeatureGrid } from "@/components/marketing/seo/FeatureGrid";
import { FaqSection } from "@/components/marketing/seo/FaqSection";
import { CtaBanner } from "@/components/marketing/seo/CtaBanner";
import { Box, RefreshCw, BarChart3, AlertTriangle, Layers, GitBranch } from "lucide-react";

export const metadata: Metadata = {
  title: "Cloud Inventory Management Software | WhatsQuery",
  description: "Track stock levels in real-time across multiple branches with WhatsQuery. Prevent stockouts and automate reordering seamlessly.",
  alternates: {
    canonical: "https://whatsquery.example.com/features/inventory",
  }
};

const FEATURES = [
  { title: "Real-Time Stock Sync", description: "Every sale, purchase, and return updates your master inventory ledge instantly without batch delays.", icon: RefreshCw },
  { title: "Multi-Branch Locations", description: "Track items across warehouses, retail storefronts, and digital fulfillment centers independently.", icon: GitBranch },
  { title: "Low Stock Alerts", description: "Set minimum threshold levels per SKU and receive automated system notifications before you run out.", icon: AlertTriangle },
  { title: "Variant Tracking", description: "Manage complex catalogs with item families, color matrixes, and size-level analytics effortlessly.", icon: Layers },
  { title: "Batch Operations", description: "Import bulk adjustments via CSV, or execute massive stock reconciliations during physical counts.", icon: Box },
  { title: "Valuation Reports", description: "Instantly calculate Cost of Goods Sold (COGS) and total held asset values dynamically.", icon: BarChart3 },
];

const FAQS = [
  { question: "Can I manage inventory across different addresses?", answer: "Yes. WhatsQuery supports unlimited physical and digital Branches. Stock levels, transfers, and specific valuations are siloed per branch for accurate local reporting." },
  { question: "How does the system track product costs?", answer: "We utilize moving average costing natively. As you intake purchase invoices at different supplier prices, the system dynamically calculates your true held cost." },
  { question: "Do you support barcode scanning?", answer: "Absolutely. All SKUs and primary barcodes are searchable in our Sales portals, turning any standard USB/Bluetooth scanner into an instant checkout engine." },
];

export default function InventoryFeaturePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SeoHero 
        badge="Inventory Control"
        headline="Never Miss A Sale Due To Stockouts."
        subheadline="Take absolute control over your physical products. Track movements, predict demand, and maintain the perfect balance of capital across all your branches."
      />
      <FeatureGrid features={FEATURES} headline="Inventory Capabilities" />
      <FaqSection faqs={FAQS} />
      <CtaBanner headline="Ready to take control of your warehouse?" />
    </div>
  );
}
