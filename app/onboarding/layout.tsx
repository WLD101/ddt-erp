import Link from "next/link";
import type { Metadata } from "next";
import { BrandLogo } from "@/components/ui/brand-logo";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Setup Your Workspace - WhatsQuery",
  description: "Complete your business onboarding to get started with WhatsQuery.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-theme onboarding-theme relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[50vw] w-[50vw] rounded-full bg-indigo-600/20 opacity-40 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-5%] h-[40vw] w-[40vw] rounded-full bg-purple-600/20 opacity-30 blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] h-[60vw] w-[60vw] rounded-full bg-blue-600/10 opacity-40 blur-[150px] mix-blend-screen" />
      </div>

      <header className="glass-nav relative z-10 border-b border-white/5 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <BrandLogo size="sm" dark />
          </Link>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Secure Setup Session
        </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">{children}</main>
    </div>
  );
}

