import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import "@/styles/marketing.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-theme min-h-screen w-full flex flex-col relative overflow-hidden selection:bg-indigo-500/40">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] opacity-40 mix-blend-screen animate-pulse duration-[10s]"></div>
        <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px] opacity-30 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px] opacity-30 mix-blend-screen"></div>
      </div>

      <header className="glass-nav fixed top-0 z-30 w-full">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <BrandLogo size="lg" dark={true} />
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="/auth/signup" className="hover:text-white transition">Book Demo</Link>
          </div>

          <Link
            href="/auth/signup"
            className="hidden rounded-full bg-white px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-white/10 transition hover:bg-slate-200 md:block"
          >
            Start Free Trial
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-20 pt-28 md:pt-32">
        {children}
      </main>

      <div className="relative z-10 pb-10 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">
        Secure WhatsQuery workspace access
      </div>
    </div>
  );
}

