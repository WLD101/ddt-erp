import type { Metadata } from "next";
import Link from "next/link";

import { LocalizedVoicePrice, VoiceLocalizedPricingNote } from "@/components/voice/voice-localized-pricing";
import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";
import { getPricingProfile } from "@/modules/voice/pricing-profiles";

export const metadata: Metadata = {
  title: "WhatsQuery Voice Pakistan Pricing",
  description: "Localized PKR pricing profile for WhatsQuery Voice in Pakistan.",
  alternates: { canonical: "/pk/pricing" },
};

export default async function PkPricingPage() {
  const host = await getVoiceRequestHost();
  const pricing = getPricingProfile("pk");
  const homeHref = toVoiceExternalPath("/pk", host);
  const loginHref = toVoiceExternalPath("/login", host);
  const onboardingHref = toVoiceExternalPath("/onboarding", host);
  const pricingHref = toVoiceExternalPath("/pk/pricing", host);
  const docsHref = toVoiceExternalPath("/docs", host);

  return (
    <VoiceMarketingShell homeHref={homeHref} loginHref={loginHref} onboardingHref={onboardingHref} pricingHref={pricingHref} docsHref={docsHref}>
      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/40 p-8 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Pakistan pricing</p>
          <h1 className="mt-3 text-4xl font-black text-white">PKR-first pricing for voice, WhatsApp, and operations.</h1>
          <VoiceLocalizedPricingNote className="mt-4 max-w-2xl text-sm text-slate-400" />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {pricing.plans.map((plan) => (
              <div key={plan.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-black text-white">{plan.name}</h2>
                <p className="mt-2 min-h-[72px] text-sm leading-7 text-slate-300">{plan.description}</p>
                <div className="mt-6">
                  <LocalizedVoicePrice prices={plan.prices} amountClassName="text-3xl font-black text-white" periodClassName="mt-1 text-sm text-slate-400" />
                </div>
              </div>
            ))}
          </div>
          <Link href="mailto:contact@whatsquery.com" className="mt-8 inline-flex rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
            WhatsApp ya sales se baat karein
          </Link>
        </div>
      </main>
    </VoiceMarketingShell>
  );
}
