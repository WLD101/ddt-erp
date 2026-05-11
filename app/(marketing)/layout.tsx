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
    <div className="marketing-theme min-h-screen relative text-slate-300 antialiased selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Ambient Light Background Effects from MainSite */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] opacity-40 mix-blend-screen animate-pulse duration-[10s]"></div>
        <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px] opacity-30 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[150px] opacity-40 mix-blend-screen"></div>
      </div>

      <Suspense fallback={null}>
        <ReferralTracker />
      </Suspense>

      <header className="glass-nav fixed w-full top-0 z-50 transition-all duration-300">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <BrandLogo size="sm" dark={true} />
          </Link>

          <div className="hidden lg:flex gap-8 font-medium text-slate-400 text-sm">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="/auth/signup" className="hover:text-white transition">Book Demo</Link>
            <Link href="/auth/signin" className="hover:text-white transition">Client Login</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/signup" className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-200 transition active:scale-95 shadow-lg shadow-white/10">
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 flex-1 pt-24">{children}</main>

      <footer className="border-t border-white/5 bg-[#020617] pt-20 pb-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link href="/" className="block">
                <BrandLogo size="sm" dark={true} />
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed">
                WhatsQuery is an AI-ready Enterprise platform tailored for fast-growing SME trading, wholesale, and distribution operations.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Solutions</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-indigo-400 transition">Inventory</Link></li>
                <li><Link href="#" className="hover:text-indigo-400 transition">Accounting</Link></li>
                <li><Link href="#" className="hover:text-indigo-400 transition">Wholesale</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-indigo-400 transition">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-indigo-400 transition">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <address className="not-italic text-sm text-slate-400 space-y-4">
                <p>International House, 61 Mosley St.<br/>Manchester, UK</p>
                <p><a href="mailto:contact@whatsquery.com" className="hover:text-white font-bold transition">contact@whatsquery.com</a></p>
              </address>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-white/5 text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} WhatsQuery. All rights reserved. Built with Starlight Technology.
          </div>
        </div>
      </footer>
    </div>
  );
}

