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
    <div className="group relative overflow-hidden rounded-[24px] border border-outline-variant/30 bg-surface p-6 shadow-soft transition-all hover:bg-surface-container-low hover:border-primary/30">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10"></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
            <span className="material-symbols-outlined text-[24px] text-primary">smart_toy</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-on-surface tracking-tight">{agent.displayName}</h3>
            <p className="text-xs font-semibold text-primary">{agent.persona}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-on-surface-variant/75">{agent.businessName}</p>
          </div>
        </div>
        <VoiceStatusPill 
          variant={isConnected ? "online" : "warning"}
          label={isConnected ? "Connected" : "Not Synced"}
          pulse={isConnected}
        />
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-on-surface-variant">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Language</div>
          <div className="font-semibold text-on-surface">{agent.languageMode}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Status</div>
          <div className="font-semibold text-on-surface">{agent.isActive ? "Enabled" : "Disabled"}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Internal key</div>
          <div className="font-semibold text-on-surface truncate">{agent.internalName}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Generated Vapi Assistant</div>
          <div className="font-semibold text-on-surface truncate">{agent.assistantName}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Business slug</div>
          <div className="font-semibold text-on-surface">{agent.businessSlug}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Agent slug</div>
          <div className="font-semibold text-on-surface">{agent.agentSlug}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Environment</div>
          <div className="font-semibold text-on-surface">{agent.environment}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Forwarding Number</div>
          <div className="font-semibold text-on-surface truncate">
            {agent.clientPublicPhoneNumber || "Not configured"}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">AI Receptionist Number</div>
          <div className="font-semibold text-on-surface truncate">
            {agent.assignedVapiPhoneNumber || "Not assigned"}
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold">Forwarding Status</div>
          <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${agent.forwardingStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : agent.forwardingStatus === "PENDING_VERIFICATION" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
            {agent.forwardingStatus.replace("_", " ")}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Prompt Preview</div>
          <div className="line-clamp-4 rounded-2xl border border-outline-variant bg-surface-container-low px-3 py-3 text-xs leading-6 text-on-surface-variant font-mono">
            {agent.promptPreview}
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold">Prompt freshness</div>
          <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${agent.isPromptStale ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
            {agent.isPromptStale ? "Stale" : "Fresh"}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1">Last synced at</div>
          <div className="font-semibold text-on-surface">{agent.lastSyncedAt ? agent.lastSyncedAt.toLocaleString() : "Never synced"}</div>
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between border-t border-outline-variant/10 pt-4">
        {isConnected ? (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
            <VoiceWaveform active className="w-8 text-emerald-500" />
            <span className="uppercase tracking-wider text-[9px]">Vapi Online</span>
          </div>
        ) : (
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider text-[9px]">
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
            className="rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-on-surface transition hover:bg-surface-container-low"
          >
            Train
          </Link>
        </div>
      </div>
    </div>
  );
}
