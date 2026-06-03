import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext } from "@/lib/tenant";

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
        <h1 className="text-3xl font-black tracking-tight text-on-surface">AI Agents</h1>
        <p className="text-sm font-medium text-on-surface-variant max-w-2xl">
          Manage your organization&apos;s AI receptionists and specialized order-takers. Each agent can have its own Vapi integration and system prompt.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${agent.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-error/10 text-error"}`}>
                {agent.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-on-surface flex items-center gap-2">
                  {agent.name}
                  {agent.isDefault && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Default
                    </span>
                  )}
                </h2>
                <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Role: {agent.role}</p>
              </div>

              <div className="space-y-2 text-sm text-on-surface-variant">
                <p><strong>Tone:</strong> {agent.tone}</p>
                <p><strong>Language:</strong> {agent.languageMode}</p>
                <p className="font-mono text-[10px] bg-surface-container-lowest p-2 rounded-lg truncate mt-2">
                  Assistant ID: {agent.vapiAssistantId || "Not configured"}
                </p>
                <p className="font-mono text-[10px] bg-surface-container-lowest p-2 rounded-lg truncate">
                  Phone ID: {agent.vapiPhoneNumberId || "Not configured"}
                </p>
              </div>

              <div className="pt-4 border-t border-outline-variant/20 flex gap-3">
                <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">Edit Config</button>
                <button className="text-xs font-bold text-on-surface hover:underline uppercase tracking-widest">View Calls</button>
              </div>
            </div>
          </div>
        ))}

        <div className="p-6 rounded-3xl border-2 border-dashed border-outline-variant/30 bg-surface/50 flex flex-col items-center justify-center text-center space-y-4 hover:bg-surface transition-colors cursor-pointer min-h-[280px]">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-on-surface">Create New Agent</h3>
            <p className="text-xs text-on-surface-variant mt-1">Deploy a new specialized AI assistant.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
