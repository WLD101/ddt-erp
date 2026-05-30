import { headers } from "next/headers";

import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { getVoiceRequestHost, isVoiceHost, toVoiceExternalPath, toVoiceInternalPath } from "@/lib/voice/routing";

export default async function VoiceStatusPage(_props: PageProps<"/voice/status">) {
  const host = await getVoiceRequestHost();
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "/";
  const homeHref = toVoiceExternalPath("/", host);
  const loginHref = toVoiceExternalPath("/login", host);
  const onboardingHref = toVoiceExternalPath("/onboarding", host);

  return (
    <VoiceMarketingShell homeHref={homeHref} loginHref={loginHref} onboardingHref={onboardingHref}>
      <main className="mx-auto max-w-4xl px-6 py-20">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Voice smoke test</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Voice routing foundation is active</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            This public status page confirms that the standalone receptionist surface is reachable. Live calling, telephony webhooks, and provider integrations are still intentionally disabled in this phase.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Host</div>
              <p className="mt-2 text-lg font-bold text-white">{host ?? "unknown"}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Voice host detected</div>
              <p className="mt-2 text-lg font-bold text-white">{isVoiceHost(host) ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Requested path</div>
              <p className="mt-2 text-lg font-bold text-white">{pathname}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Expected internal root</div>
              <p className="mt-2 text-lg font-bold text-white">{toVoiceInternalPath("/")}</p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm leading-7 text-slate-200">
            Calling status: <span className="font-black text-white">not live yet</span>. This page is only a routing and deployment smoke test.
          </div>
        </section>
      </main>
    </VoiceMarketingShell>
  );
}
