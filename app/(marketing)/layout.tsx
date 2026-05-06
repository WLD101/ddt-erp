import { Metadata } from "next";
import Link from "next/link";
import "@/styles/marketing.css";

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
    <div className="flex min-h-screen flex-col bg-[#0a0a12] text-white antialiased">
      <Suspense fallback={null}>
        <ReferralTracker />
      </Suspense>

        <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-[0_0_12px_rgba(124,58,237,0.5)]">
                <span className="text-lg font-bold text-white">W</span>
              </div>
              <span className="text-xl font-black uppercase italic tracking-tighter text-white">
                Whats<span className="text-primary">Query</span>
              </span>
            </Link>

            <ul className="flex items-center space-x-6 text-sm font-medium">
              <li><Link href="/" className="transition-colors hover:text-primary">Home</Link></li>
              <li><Link href="/pricing" className="transition-colors hover:text-primary">Pricing</Link></li>
              <li><Link href="/book-demo" className="transition-colors hover:text-primary">Book Demo</Link></li>
              <li><Link href="/auth/signin" className="transition-colors hover:text-primary">Sign In</Link></li>
              <li>
                <Link href="/auth/signup" className="rounded-full bg-primary px-4 py-2 font-bold transition-colors shadow-lg shadow-primary/20 hover:bg-primary/90">
                  Start Free Trial
                </Link>
              </li>
            </ul>
          </nav>
        </header>

      <main className="flex-1 overflow-x-hidden">{children}</main>

      <footer className="border-t border-white/5 bg-black/70 py-16 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 text-sm text-muted-foreground md:grid-cols-4">
          <div className="md:col-span-1">
            <h4 className="mb-4 text-lg font-black uppercase italic tracking-tighter text-white">
              Whats<span className="text-primary">Query</span>
            </h4>
            <p className="mb-4">
              The AI-ready operating system for modern businesses to manage sales, inventory, purchases, expenses, reports, and connected commerce.
            </p>
            <p>&copy; {new Date().getFullYear()} WhatsQuery.</p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/features/inventory" className="transition-colors hover:text-primary">Inventory</Link></li>
              <li><Link href="/features/sales-and-billing" className="transition-colors hover:text-primary">Sales & Billing</Link></li>
              <li><Link href="/features/purchasing" className="transition-colors hover:text-primary">Purchasing</Link></li>
              <li><Link href="/features/financial-reports" className="transition-colors hover:text-primary">Reports</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">Industries</h4>
            <ul className="space-y-2">
              <li><Link href="/industries/small-business-erp" className="transition-colors hover:text-primary">Small Business</Link></li>
              <li><Link href="/industries/wholesale-erp" className="transition-colors hover:text-primary">Wholesale</Link></li>
              <li><Link href="/industries/retail-erp" className="transition-colors hover:text-primary">Retail</Link></li>
              <li><Link href="/industries/manufacturing-erp" className="transition-colors hover:text-primary">Manufacturing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">Company</h4>
            <ul className="space-y-2">
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
