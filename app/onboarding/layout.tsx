import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Your Workspace - WhatsQuery",
  description: "Complete your business onboarding to get started with WhatsQuery.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-container-lowest">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute right-1/4 bottom-0 h-[500px] w-[500px] translate-y-1/2 rounded-full bg-sky-500/8 blur-[120px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-10 py-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-[0_0_16px_rgba(124,58,237,0.18)]">
            <span className="text-xs font-black text-on-surface">W</span>
          </div>
          <span className="text-lg font-black uppercase italic tracking-tighter text-on-surface">
            Whats<span className="text-primary">Query</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Secure Setup Session
        </div>
      </header>

      <main className="relative z-10 flex-1">{children}</main>
    </div>
  );
}

