import Link from "next/link";
import { VoiceStatusPill } from "./voice-status-pill";
import { VoiceWaveform } from "./voice-waveform";

type VoiceAgentCardProps = {
  agent: {
    id: string;
    name: string;
    persona: string;
    languageMode: string;
    tone: string;
    vapiAssistantId: string | null;
    vapiPhoneNumberId: string | null;
    toolsEnabled: number;
    lastSyncedAt: Date | null;
  };
  hasProfile: boolean;
  hasSettings: boolean;
};

export function VoiceAgentCard({ agent, hasProfile, hasSettings }: VoiceAgentCardProps) {
  const isSyncReady = hasProfile && hasSettings;
  const isConnected = !!agent.vapiAssistantId && !!agent.vapiPhoneNumberId;

  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40 p-6 shadow-xl backdrop-blur transition-all hover:bg-slate-950/60 hover:border-cyan-500/30">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-400/5 blur-2xl transition-all group-hover:bg-cyan-400/10"></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
            <span className="material-symbols-outlined text-[24px] text-cyan-300">smart_toy</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">{agent.name}</h3>
            <p className="text-xs font-semibold text-cyan-400">{agent.persona}</p>
          </div>
        </div>
        <VoiceStatusPill 
          variant={isConnected ? "online" : "warning"}
          label={isConnected ? "Connected" : "Not Synced"}
          pulse={isConnected}
        />
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-slate-300">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Language</div>
          <div className="font-medium text-white">{agent.languageMode}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Tone</div>
          <div className="font-medium text-white">{agent.tone}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Tools Active</div>
          <div className="font-medium text-white">{agent.toolsEnabled}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Last Sync</div>
          <div className="font-medium text-white text-xs mt-0.5">
            {agent.lastSyncedAt ? new Date(agent.lastSyncedAt).toLocaleDateString() : "Never"}
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        {isConnected ? (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <VoiceWaveform active className="w-8" />
            <span className="uppercase tracking-wider text-[9px]">Vapi Online</span>
          </div>
        ) : (
          <div className="text-xs font-bold text-amber-400/80 uppercase tracking-wider text-[9px]">
            Action required
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {isSyncReady && !isConnected && (
            <Link 
              href="/voice/dashboard/integrations/vapi"
              className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-500/30"
            >
              Sync Now
            </Link>
          )}
          <Link 
            href="/voice/dashboard/training"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Train
          </Link>
        </div>
      </div>
    </div>
  );
}
