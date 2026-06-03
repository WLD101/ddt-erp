import Link from "next/link";

import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

import { VoiceWaveform } from "@/components/voice/ui/voice-waveform";

const featureCards = [
  {
    title: "AI Call Answering",
    description: "Handle inbound calls instantly with natural, low-latency AI trained on your business profile.",
  },
  {
    title: "Lead Capture",
    description: "Extract names, numbers, and intents automatically without manual data entry.",
  },
  {
    title: "Table Booking Requests",
    description: "Take table and appointment requests gracefully, enforcing your specific booking rules.",
  },
  {
    title: "Order Requests",
    description: "Allow customers to request takeaway or delivery directly through conversation.",
  },
  {
    title: "Multilingual Support",
    description: "Detect language automatically. Speak fluent English, Urdu, or Roman Urdu seamlessly.",
  },
  {
    title: "Voice Command Center",
    description: "Monitor live calls, review transcripts, and configure agents from a premium dashboard.",
  },
];

export default async function VoiceLandingPage() {
  const host = await getVoiceRequestHost();
  const homeHref = toVoiceExternalPath("/", host);
  const loginHref = toVoiceExternalPath("/login", host);
  const onboardingHref = toVoiceExternalPath("/onboarding", host);
  const dashboardHref = toVoiceExternalPath("/dashboard", host);

  return (
    <VoiceMarketingShell homeHref={homeHref} loginHref={loginHref} onboardingHref={onboardingHref}>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-cyan-200">
              <VoiceWaveform active className="w-12" />
              <span>Voice AI Receptionist</span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl">
                AI Receptionists for <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">Modern Businesses</span>
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-300">
                Answer calls, capture leads, handle requests, and turn conversations into business records seamlessly connected to your WhatsQuery ERP.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={onboardingHref}
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-3.5 text-sm font-black text-slate-950 shadow-[0_16px_32px_rgba(34,211,238,0.35)] transition hover:brightness-110 hover:shadow-[0_16px_40px_rgba(34,211,238,0.5)]"
              >
                Start Setup
              </Link>
              <Link
                href={dashboardHref}
                className="rounded-full border border-white/15 bg-white/5 backdrop-blur px-8 py-3.5 text-sm font-bold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10"
              >
                View Dashboard
              </Link>
            </div>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_rgba(8,47,73,0.35)] backdrop-blur">
            <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Foundation scope</div>
            <div className="mt-5 space-y-4">
              {[
                "Public landing page for voice.whatsquery.com",
                "Auth-ready login and protected dashboard shell",
                "Business onboarding placeholders",
                "Call logs, leads, knowledge base, and integrations sections",
                "Nginx + SSL + environment notes for same-VPS hosting",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3">
                  <span className="mt-0.5 text-cyan-300">•</span>
                  <span className="text-sm leading-6 text-slate-200">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100">
              Not included yet: live telephony, inbound call routing, SIP/webhook handling, real call storage, or receptionist AI execution.
            </p>
          </div>
        </section>

        <section id="features" className="mt-20 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card) => (
            <div key={card.title} className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_12px_30px_rgba(15,23,42,0.22)] transition-all hover:bg-white/10">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl transition-all group-hover:bg-cyan-400/20"></div>
              <h2 className="text-xl font-black tracking-tight text-white">{card.title}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">{card.description}</p>
            </div>
          ))}
        </section>

        <section id="deploy" className="mt-16 rounded-[32px] border border-white/10 bg-slate-950/40 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Same VPS hosting</div>
              <h2 className="text-3xl font-black tracking-tight text-white">Runs beside the ERP without a second app server</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                The current foundation uses the same Next.js runtime and rewrites only requests from <code className="rounded bg-white/10 px-1 py-0.5">voice.whatsquery.com</code> into an isolated internal route tree. ERP routes, tenant data, and the platform control center remain unchanged.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm leading-6 text-slate-300">
              Deployment notes are stored in <code className="rounded bg-white/10 px-1 py-0.5">docs/VOICE_SUBDOMAIN_DEPLOYMENT.md</code> for Nginx, SSL, env vars, and same-VPS rollout.
            </div>
          </div>
        </section>
      </main>
    </VoiceMarketingShell>
  );
}
