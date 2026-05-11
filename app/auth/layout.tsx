import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-surface-container-lowest flex flex-col relative overflow-hidden">
      {/* Dynamic Background Elements - using the exact same subtle brand theme gradients as onboarding */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-primary/5 blur-[140px]" />
        <div className="absolute right-1/4 bottom-0 h-[500px] w-[500px] translate-y-1/2 rounded-full bg-sky-500/5 blur-[120px]" />
      </div>
      
      <header className="relative z-10 flex items-center justify-center py-12">
        <Link href="/">
          <BrandLogo size="md" className="hover:opacity-80 transition-opacity" />
        </Link>
      </header>
      
      <div className="z-10 w-full max-w-md px-4 mx-auto flex-1 pb-20">
        {children}
      </div>
    </div>
  );
}

