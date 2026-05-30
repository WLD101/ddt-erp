import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

type SearchParams = Promise<{
  callbackUrl?: string;
}>;

function getSafeVoiceCallback(path: string | undefined, fallback: string) {
  if (!path) return fallback;
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.includes("\\") || path.includes("\n") || path.includes("\r")) {
    return fallback;
  }
  return path;
}

export default async function VoiceLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const host = await getVoiceRequestHost();
  const homeHref = toVoiceExternalPath("/", host);
  const onboardingHref = toVoiceExternalPath("/onboarding", host);
  const dashboardHref = toVoiceExternalPath("/dashboard", host);
  const params = await searchParams;
  const callbackUrl = getSafeVoiceCallback(params.callbackUrl, dashboardHref);

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return (
    <VoiceMarketingShell homeHref={homeHref} loginHref={toVoiceExternalPath("/login", host)} onboardingHref={onboardingHref}>
      <main className="mx-auto flex max-w-5xl items-center justify-center px-6 py-20">
        <section className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Auth-ready foundation</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Sign in to your receptionist workspace</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Voice uses the shared WhatsQuery identity layer for now. This keeps the standalone receptionist foundation VPS-safe while leaving room for dedicated customer auth, call seats, and channel-level permissions later.
          </p>

          <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-slate-950/35 p-5">
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-center text-sm font-black text-slate-950 shadow-[0_16px_32px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300"
            >
              Continue with WhatsQuery sign-in
            </Link>
            <Link
              href={onboardingHref}
              className="rounded-2xl border border-white/15 px-5 py-3 text-center text-sm font-bold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/5"
            >
              New business? Start onboarding
            </Link>
          </div>
        </section>
      </main>
    </VoiceMarketingShell>
  );
}
