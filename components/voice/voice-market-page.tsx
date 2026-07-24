import Link from "next/link";

import { LocalizedVoicePrice, VoiceLocalizedPricingNote } from "@/components/voice/voice-localized-pricing";
import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { getMarketProfile, type MarketKey } from "@/modules/onboarding/market-profiles";
import { getPricingProfile } from "@/modules/voice/pricing-profiles";

type VoiceMarketPageProps = {
  marketKey: MarketKey;
  homeHref: string;
  loginHref: string;
  onboardingHref: string;
  pricingHref: string;
  docsHref: string;
  marketSwitcherHref: string;
};

export function VoiceMarketPage({
  marketKey,
  homeHref,
  loginHref,
  onboardingHref,
  pricingHref,
  docsHref,
  marketSwitcherHref,
}: VoiceMarketPageProps) {
  const market = getMarketProfile(marketKey);
  const pricing = getPricingProfile(marketKey);

  return (
    <VoiceMarketingShell
      homeHref={homeHref}
      loginHref={loginHref}
      onboardingHref={onboardingHref}
      pricingHref={pricingHref}
      docsHref={docsHref}
    >
      <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <section className="grid gap-10 rounded-[40px] border border-white/10 bg-slate-950/40 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-12">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">
              {market.name} market profile
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
              {market.website.heroTitle}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              {market.website.heroBody}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={onboardingHref}
                className="inline-flex items-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-[0_12px_28px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300"
              >
                {market.website.primaryCta}
              </Link>
              <Link
                href="mailto:contact@whatsquery.com"
                className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {market.website.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Featured industries</p>
              <Link href={marketSwitcherHref} className="text-xs font-semibold text-slate-300 transition hover:text-white">
                Switch market
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {market.featuredIndustryProfiles.map((profile) => (
                <div key={profile} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm font-black capitalize text-white">{profile.replaceAll("_", " ")}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {marketKey === "uk"
                      ? "Voice, booking, lead capture, and customer-service flows aligned to this market."
                      : "Voice, WhatsApp, operational follow-up, and dashboard workflows aligned to this market."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 py-16 md:grid-cols-2">
          <div className="rounded-[32px] border border-white/10 bg-slate-950/40 p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Problems we solve</p>
            <div className="mt-6 space-y-4">
              {market.website.problemPoints.map((point) => (
                <div key={point} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-950/40 p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Localized solution</p>
            <div className="mt-6 space-y-4">
              {market.website.solutionPoints.map((point) => (
                <div key={point} className="rounded-3xl border border-cyan-300/10 bg-cyan-400/5 p-4 text-sm leading-7 text-slate-200">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/40 p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Localized pricing</p>
              <h2 className="mt-3 text-3xl font-black text-white">One pricing source of truth, localized by market.</h2>
            </div>
            <VoiceLocalizedPricingNote className="max-w-xl text-sm text-slate-400" />
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {pricing.plans.map((plan) => (
              <div key={plan.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-black text-white">{plan.name}</h3>
                <p className="mt-2 min-h-[72px] text-sm leading-7 text-slate-300">{plan.description}</p>
                <div className="mt-6">
                  <LocalizedVoicePrice
                    prices={plan.prices}
                    amountClassName="text-3xl font-black text-white"
                    periodClassName="mt-1 text-sm text-slate-400"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={pricingHref} className="text-sm font-semibold text-slate-300 transition hover:text-white">
              View pricing details
            </Link>
            <Link href={docsHref} className="text-sm font-semibold text-slate-300 transition hover:text-white">
              Read voice docs
            </Link>
          </div>
        </section>
      </main>
    </VoiceMarketingShell>
  );
}
