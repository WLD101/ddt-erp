import Link from "next/link";
import { VoiceStatusPill } from "./voice-status-pill";
import { VoiceWaveform } from "./voice-waveform";
import { VoiceAgentSyncButton } from "./voice-agent-sync-button";

type VoiceAgentCardProps = {
  agent: {
    id: string;
    name: string;
    displayName: string;
    internalName: string;
    businessName: string;
    businessSlug: string;
    agentSlug: string;
    environment: string;
    persona: string;
    languageMode: string;
    tone: string;
    vapiAssistantId: string | null;
    vapiPhoneNumberId: string | null;
    clientPublicPhoneNumber: string | null;
    assignedVapiPhoneNumber: string | null;
    forwardingStatus: string;
    toolsEnabled: number;
    lastSyncedAt: Date | null;
    isActive: boolean;
    promptPreview: string;
    assistantName: string;
    isPromptStale: boolean;
    hasPromptValidationErrors: boolean;
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
            <h3 className="text-lg font-black text-white tracking-tight">{agent.displayName}</h3>
            <p className="text-xs font-semibold text-cyan-400">{agent.persona}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">{agent.businessName}</p>
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
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Status</div>
          <div className="font-medium text-white">{agent.isActive ? "Enabled" : "Disabled"}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Internal key</div>
          <div className="font-medium text-white truncate">{agent.internalName}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Generated Vapi Assistant</div>
          <div className="font-medium text-white truncate">{agent.assistantName}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Business slug</div>
          <div className="font-medium text-white">{agent.businessSlug}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Agent slug</div>
          <div className="font-medium text-white">{agent.agentSlug}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Environment</div>
          <div className="font-medium text-white">{agent.environment}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Forwarding Number</div>
          <div className="font-medium text-white truncate">
            {agent.clientPublicPhoneNumber || "Not configured"}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">AI Receptionist Number</div>
          <div className="font-medium text-white truncate">
            {agent.assignedVapiPhoneNumber || "Not assigned"}
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Forwarding Status</div>
          <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${agent.forwardingStatus === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400" : agent.forwardingStatus === "PENDING_VERIFICATION" ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-400"}`}>
            {agent.forwardingStatus.replace("_", " ")}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Prompt Preview</div>
          <div className="line-clamp-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-xs leading-6 text-slate-300">
            {agent.promptPreview}
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Prompt freshness</div>
          <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${agent.isPromptStale ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
            {agent.isPromptStale ? "Stale" : "Fresh"}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Last synced at</div>
          <div className="font-medium text-white">{agent.lastSyncedAt ? agent.lastSyncedAt.toLocaleString() : "Never synced"}</div>
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
            <VoiceAgentSyncButton voiceAgentId={agent.id} disabled={agent.hasPromptValidationErrors} />
          )}
          {isSyncReady && isConnected ? <VoiceAgentSyncButton voiceAgentId={agent.id} disabled={agent.hasPromptValidationErrors} /> : null}
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
