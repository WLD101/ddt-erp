import { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import "@/styles/marketing.css"; // optional custom styles

export const metadata: Metadata = {
  title: "NexusERP – Cloud ERP for Wholesalers, Retailers & SMEs",
  description: "Streamline sales, inventory, finance and more with NexusERP. Start your free trial today and power your business.",
  openGraph: {
    title: "NexusERP – Cloud ERP for Wholesalers, Retailers & SMEs",
    description: "Streamline sales, inventory, finance and more with NexusERP. Start your free trial today.",
    url: "https://nexuserp.com",
    siteName: "NexusERP",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
};

import { ReferralTracker } from "@/components/marketing/referral-tracker";
import { Suspense } from "react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#0a0a12] text-white antialiased">
      <body className="flex flex-col min-h-screen">
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
          <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.5)]">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">
                Nexus<span className="text-primary">ERP</span>
              </span>
            </Link>
            <ul className="flex items-center space-x-6 text-sm font-medium">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li className="relative group">
                <span className="hover:text-primary transition-colors cursor-pointer py-2">Features</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-slate-900 border border-white/10 rounded-xl shadow-xl flex flex-col p-2">
                  <Link href="/features/inventory" className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors">Inventory</Link>
                  <Link href="/features/sales-and-billing" className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors">Sales & Billing</Link>
                  <Link href="/features/purchasing" className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors">Purchasing</Link>
                  <Link href="/features/financial-reports" className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors">Financial Reports</Link>
                  <Link href="/features/quotations" className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors">Quotations</Link>
                </div>
              </li>
              <li className="relative group">
                <span className="hover:text-primary transition-colors cursor-pointer py-2">Industries</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-slate-900 border border-white/10 rounded-xl shadow-xl flex flex-col p-2">
                  <Link href="/industries/small-business-erp" className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors">Small Business</Link>
                  <Link href="/industries/wholesale-erp" className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors">Wholesale Business</Link>
                  <Link href="/industries/retail-erp" className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors">Retail Business</Link>
                </div>
              </li>
              <li><Link href="/auth/signin" className="hover:text-primary transition-colors">Sign In</Link></li>
              <li><Link href="/signup" className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-full font-bold transition-colors shadow-lg shadow-primary/20">Start Free Trial</Link></li>
            </ul>
          </nav>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
        {/* Footer */}
        <footer className="bg-black/70 backdrop-blur-md border-t border-white/5 py-16">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-muted-foreground">
            <div className="md:col-span-1">
              <h4 className="font-black text-white text-lg tracking-tighter uppercase italic mb-4">Nexus<span className="text-primary">ERP</span></h4>
              <p className="mb-4">The all-in-one cloud operating system to run your business operations beautifully.</p>
              <p>© {new Date().getFullYear()} NexusERP.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Features</h4>
              <ul className="space-y-2">
                <li><Link href="/features/inventory" className="hover:text-primary transition-colors">Inventory Control</Link></li>
                <li><Link href="/features/sales-and-billing" className="hover:text-primary transition-colors">Sales & Invoicing</Link></li>
                <li><Link href="/features/purchasing" className="hover:text-primary transition-colors">Purchase Orders</Link></li>
                <li><Link href="/features/financial-reports" className="hover:text-primary transition-colors">Financial Reports</Link></li>
                <li><Link href="/features/quotations" className="hover:text-primary transition-colors">Quotations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Industries</h4>
              <ul className="space-y-2">
                <li><Link href="/industries/small-business-erp" className="hover:text-primary transition-colors">Small Business ERP</Link></li>
                <li><Link href="/industries/wholesale-erp" className="hover:text-primary transition-colors">Wholesale Distribution</Link></li>
                <li><Link href="/industries/retail-erp" className="hover:text-primary transition-colors">Retail POS & Manage</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing & Plans</Link></li>
                <li><Link href="/auth/signin" className="hover:text-primary transition-colors">Sign In</Link></li>
                <li><a href="mailto:sales@nexuserp.com" className="hover:text-primary transition-colors">Contact Sales</a></li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
