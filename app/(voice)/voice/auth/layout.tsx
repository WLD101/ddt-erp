import React from "react";
import Link from "next/link";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

export default async function VoiceAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = await getVoiceRequestHost();
  const homeHref = toVoiceExternalPath("/", host);
  const signupHref = toVoiceExternalPath("/auth/signup", host);

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden bg-[#0A0A0B] selection:bg-cyan-500/40 text-slate-200">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-600/10 rounded-full blur-[140px] opacity-40 mix-blend-screen animate-pulse duration-[15s]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] opacity-30 mix-blend-screen"></div>
      </div>

      <header className="fixed top-0 z-30 w-full border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href={homeHref} className="hover:opacity-80 transition-opacity flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl border border-white/20 flex items-center justify-center">
              <img src="/logo-emblem.png" alt="WhatsQuery Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">WhatsQuery <span className="text-cyan-400">Voice</span></span>
          </Link>

          <Link
            href="/voice/auth/signup"
            className="hidden rounded-full bg-cyan-400/10 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-400 border border-cyan-400/20 shadow-lg shadow-cyan-900/20 transition hover:bg-cyan-400/20 md:block"
          >
            Create Workspace
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 pb-20 pt-28 md:pt-32">
        {children}
      </main>

      <div className="relative z-10 pb-10 text-center text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
        AI Receptionist Platform
      </div>
    </div>
  );
}
