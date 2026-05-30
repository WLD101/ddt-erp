import Link from "next/link";

import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

const onboardingSteps = [
  "Business identity and receptionist brand tone",
  "Primary phone number, office hours, and escalation contacts",
  "Lead capture fields and appointment intake preferences",
  "Knowledge base upload and FAQ categories",
  "Telephony provider setup for Vapi or Twilio later",
];

export default async function VoiceOnboardingPage() {
  const host = await getVoiceRequestHost();
  const homeHref = toVoiceExternalPath("/", host);
  const loginHref = toVoiceExternalPath("/login", host);
  const dashboardHref = toVoiceExternalPath("/dashboard", host);

  return (
    <VoiceMarketingShell homeHref={homeHref} loginHref={loginHref} onboardingHref={toVoiceExternalPath("/onboarding", host)}>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_18px_48px_rgba(15,23,42,0.25)]">
            <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Business onboarding</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Prepare your receptionist before phone lines go live</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              This onboarding shell is separated from ERP onboarding. It is designed for voice-specific setup, caller journeys, and business response policies.
            </p>
            <div className="mt-8 space-y-3">
              {onboardingSteps.map((step, index) => (
                <div key={step} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-slate-950">
                    {index + 1}
                  </div>
                  <div className="text-sm leading-6 text-slate-200">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-slate-950/40 p-8 shadow-[0_18px_48px_rgba(15,23,42,0.25)]">
            <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Current status</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Telephony provider", "Not connected"],
                ["Live call routing", "Not configured"],
                ["Business script", "Placeholder only"],
                ["Knowledge sources", "Ready for setup"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{label}</div>
                  <div className="mt-2 text-lg font-black text-white">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={dashboardHref}
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                Open receptionist dashboard
              </Link>
              <Link
                href={loginHref}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/5"
              >
                Sign in first
              </Link>
            </div>
          </div>
        </section>
      </main>
    </VoiceMarketingShell>
  );
}
