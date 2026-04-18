import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Your Workspace — NexusERP",
  description: "Complete your business onboarding to get started with NexusERP.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080812] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px] translate-y-1/2" />
      </div>

      {/* Top bar — logo only */}
      <header className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.5)]">
            <span className="text-white font-black text-xs">N</span>
          </div>
          <span className="font-black text-lg tracking-tighter text-white uppercase italic">
            Nexus<span className="text-primary">ERP</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Secure Setup Session
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1">
        {children}
      </main>
    </div>
  );
}
