import Link from "next/link";

import { VoiceBrand } from "@/components/voice/voice-brand";

type VoiceNavItem = {
  label: string;
  href: string;
  description: string;
};

type VoiceDashboardShellProps = {
  title: string;
  description: string;
  homeHref: string;
  navItems: VoiceNavItem[];
  children: React.ReactNode;
};

export function VoiceDashboardShell({
  title,
  description,
  homeHref,
  navItems,
  children,
}: VoiceDashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-5 py-6">
          <VoiceBrand href={homeHref} caption="Receptionist Console" />
          <div className="mt-8 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-white/8 bg-white/5 px-4 py-3 transition hover:border-cyan-400/35 hover:bg-cyan-400/10"
              >
                <div className="text-sm font-black text-white">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-300">{item.description}</div>
              </Link>
            ))}
          </div>
        </aside>
        <main className="bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_24%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.38)] backdrop-blur">
              <div className="mb-6 space-y-2">
                <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Voice Operations</div>
                <h1 className="text-3xl font-black tracking-tight text-white">{title}</h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
