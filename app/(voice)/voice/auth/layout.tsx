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
            <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-white">WhatsQuery <span className="text-cyan-400">Voice</span></span>
          </Link>

          <Link
            href={signupHref}
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
