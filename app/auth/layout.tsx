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
      {/* Ambient Background Glows from MainSite */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] opacity-40 mix-blend-screen animate-pulse duration-[10s]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px] opacity-30 mix-blend-screen"></div>
      </div>
      
      <header className="relative z-10 flex items-center justify-center py-12">
        <Link href="/">
          <BrandLogo size="md" dark={true} className="hover:opacity-80 transition-opacity" />
        </Link>
      </header>
      
      <main className="relative z-10 w-full max-w-md px-4 mx-auto flex-1 pb-20 flex flex-col items-center justify-center">
        {children}
      </main>
    </div>
  );
}

