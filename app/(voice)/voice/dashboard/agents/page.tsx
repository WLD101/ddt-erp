import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext } from "@/lib/tenant";
import { VoiceAgentCard } from "@/components/voice/ui/voice-agent-card";

export default async function VoiceDashboardAgentsPage() {
  const ctx = await getCurrentTenantContext();
  const organizationId = ctx.organizationId;

  const agents = await prisma.voiceAgent.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-white">AI Agents</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Manage your organization&apos;s AI receptionists and specialized order-takers. Each agent can have its own Vapi integration and system prompt.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <VoiceAgentCard
            key={agent.id}
            agent={{
              id: agent.id,
              name: agent.name,
              persona: agent.role,
              languageMode: agent.languageMode,
              tone: agent.tone,
              vapiAssistantId: agent.vapiAssistantId,
              vapiPhoneNumberId: agent.vapiPhoneNumberId,
              toolsEnabled: agent.allowedTools ? agent.allowedTools.split(",").length : 0,
              lastSyncedAt: agent.lastPromptSyncedAt,
            }}
            hasProfile={true}
            hasSettings={true}
          />
        ))}

        <div className="group rounded-[24px] border-2 border-dashed border-white/10 bg-slate-950/20 flex flex-col items-center justify-center text-center space-y-4 hover:bg-white/5 hover:border-cyan-500/30 transition-all cursor-pointer min-h-[280px]">
          <div className="w-14 h-14 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center transition-transform group-hover:scale-110">
            <span className="material-symbols-outlined text-[28px]">add</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Deploy New Agent</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Create a specialized AI assistant.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
