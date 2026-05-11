import { Metadata } from "next";
import Link from "next/link";
import "@/styles/marketing.css";
import { BrandLogo } from "@/components/ui/brand-logo";

import { ReferralTracker } from "@/components/marketing/referral-tracker";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "WhatsQuery - Cloud ERP for Modern Teams",
  description: "Streamline sales, inventory, finance, and ecommerce operations with WhatsQuery.",
  openGraph: {
    title: "WhatsQuery - Cloud ERP for Modern Teams",
    description: "An AI-ready ERP for modern businesses to manage sales, inventory, purchases, expenses, reports, and connected commerce without spreadsheet chaos.",
    url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    siteName: "WhatsQuery",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-container-lowest text-on-surface antialiased">
      <Suspense fallback={null}>
        <ReferralTracker />
      </Suspense>

        <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-xl shadow-sm">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <BrandLogo size="sm" />
            </Link>

            <ul className="flex items-center space-x-8 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">
              <li><Link href="/" className="transition-colors hover:text-primary">Home</Link></li>
              <li><Link href="/pricing" className="transition-colors hover:text-primary">Pricing</Link></li>
              <li><Link href="/auth/signup" className="transition-colors hover:text-primary">Book Demo</Link></li>
              <li><Link href="/auth/signin" className="transition-colors hover:text-primary">Sign In</Link></li>
              <li>
                <Link href="/auth/signup" className="rounded-xl bg-primary px-5 py-2.5 text-on-primary transition-all shadow-lg shadow-primary/20 hover:bg-primary/90 font-black">
                  Start Free Trial
                </Link>
              </li>
            </ul>
          </nav>
        </header>

      <main className="flex-1 overflow-x-hidden">{children}</main>

      <footer className="border-t border-outline-variant/10 bg-surface py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 text-sm text-on-surface-variant md:grid-cols-4">
          <div className="md:col-span-1">
            <BrandLogo size="sm" className="mb-6" />
            <p className="mb-6 text-xs font-medium leading-relaxed">
              The AI-ready operating system for modern businesses to manage sales, inventory, purchases, expenses, reports, and connected commerce.
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">&copy; {new Date().getFullYear()} WhatsQuery.</p>
          </div>

          <div>
            <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Product</h4>
            <ul className="space-y-3 text-[11px] font-medium">
              <li><Link href="/features/inventory" className="transition-colors hover:text-primary">Inventory</Link></li>
              <li><Link href="/features/sales-and-billing" className="transition-colors hover:text-primary">Sales & Billing</Link></li>
              <li><Link href="/features/purchasing" className="transition-colors hover:text-primary">Purchasing</Link></li>
              <li><Link href="/features/financial-reports" className="transition-colors hover:text-primary">Reports</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Industries</h4>
            <ul className="space-y-3 text-[11px] font-medium">
              <li><Link href="/industries/small-business-erp" className="transition-colors hover:text-primary">Small Business</Link></li>
              <li><Link href="/industries/wholesale-erp" className="transition-colors hover:text-primary">Wholesale</Link></li>
              <li><Link href="/industries/retail-erp" className="transition-colors hover:text-primary">Retail</Link></li>
              <li><Link href="/industries/manufacturing-erp" className="transition-colors hover:text-primary">Manufacturing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Company</h4>
            <ul className="space-y-3 text-[11px] font-medium">
              <li><Link href="/pricing" className="transition-colors hover:text-primary">Pricing & Plans</Link></li>
              <li><Link href="/auth/signin" className="transition-colors hover:text-primary">Sign In</Link></li>
              <li><a href="mailto:sales@whatsquery.example.com" className="transition-colors hover:text-primary">Contact Sales</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

