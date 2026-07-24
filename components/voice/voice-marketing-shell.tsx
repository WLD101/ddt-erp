import Link from "next/link";

import { VoiceBrand } from "@/components/voice/voice-brand";

type VoiceMarketingShellProps = {
  homeHref: string;
  loginHref: string;
  onboardingHref: string;
  pricingHref: string;
  docsHref: string;
  children: React.ReactNode;
};

export function VoiceMarketingShell({
  homeHref,
  loginHref,
  onboardingHref,
  pricingHref,
  docsHref,
  children,
}: VoiceMarketingShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(14,116,144,0.14),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_42%,#111827_100%)] text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <VoiceBrand href={homeHref} />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-200 md:flex">
            <Link href={homeHref} className="transition hover:text-white">
              Product
            </Link>
            <Link href={`${homeHref}#features`} className="transition hover:text-white">
              Features
            </Link>
            <Link href={`${homeHref}#deploy`} className="transition hover:text-white">
              Deployment
            </Link>
            <Link href={pricingHref} className="transition hover:text-white">
              Pricing
            </Link>
            <Link href={docsHref} className="transition hover:text-white">
              Docs
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href={loginHref}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/5"
            >
              Sign in
            </Link>
            <Link
              href={onboardingHref}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 shadow-[0_12px_28px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300"
            >
              Start setup
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
