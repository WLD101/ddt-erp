import Link from "next/link";

import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

const foundationCards = [
  {
    title: "Inbound Call Flows",
    description: "Prepare business-specific greetings, routing rules, after-hours handling, and fallback handoff paths.",
  },
  {
    title: "Lead & Appointment Capture",
    description: "Collect caller details, booking intent, appointment windows, and qualification notes without mixing into ERP actions.",
  },
  {
    title: "Knowledge Base",
    description: "Load FAQs, pricing summaries, service menus, and escalation guidance for receptionist-safe answers later.",
  },
  {
    title: "Telephony Integrations",
    description: "Keep Vapi/Twilio-ready settings isolated until live phone numbers, webhooks, and credentials are approved.",
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
            <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-cyan-200">
              Separate product foundation
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl">
                AI receptionist infrastructure for <span className="text-cyan-300">voice.whatsquery.com</span>
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-300">
                This product is intentionally separated from the ERP assistant. It is the foundation for inbound call handling,
                business profiles, telephony integration, call logs, lead capture, and appointment workflows on the same VPS.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={onboardingHref}
                className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-[0_16px_32px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300"
              >
                Launch business onboarding
              </Link>
              <Link
                href={dashboardHref}
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/5"
              >
                Preview dashboard shell
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

        <section id="features" className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {foundationCards.map((card) => (
            <div key={card.title} className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.22)]">
              <h2 className="text-xl font-black tracking-tight text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
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
