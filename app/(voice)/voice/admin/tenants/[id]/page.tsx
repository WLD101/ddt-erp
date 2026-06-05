import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminTenantVoicePage({ params }: { params: { id: string } }) {
  const organizationId = params.id;

  const [org, agents, integration] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: { voiceBusinessProfile: true },
    }),
    prisma.voiceAgent.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.voiceIntegrationSettings.findUnique({
      where: { organizationId },
    }),
  ]);

  if (!org) {
    return notFound();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">{org.name} - Voice Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage Vapi numbers and call forwarding for this tenant.</p>
        </div>
        <Link href="/voice/admin/tenants" className="text-sm font-bold text-cyan-400 hover:underline">
          &larr; Back to Tenants
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-xl font-black text-white">Voice Agents</h2>
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-[24px] border border-white/10 bg-slate-950/40 p-6">
              <h3 className="text-lg font-bold text-white">{agent.name}</h3>
              <p className="text-xs font-semibold text-cyan-400 mb-4">{agent.role}</p>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Vapi Assistant ID</label>
                  <p className="text-slate-200">{agent.vapiAssistantId || "None"}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Vapi Phone Number ID</label>
                  <p className="text-slate-200">{agent.vapiPhoneNumberId || "None"}</p>
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">
                    AI Receptionist Number (Vapi Assigned)
                  </label>
                  <input 
                    type="text" 
                    defaultValue={agent.assignedVapiPhoneNumber || ""}
                    placeholder="+1234567890"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" 
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">
                    Client Forwarding Number (Public)
                  </label>
                  <input 
                    type="text" 
                    defaultValue={agent.clientPublicPhoneNumber || ""}
                    placeholder="+1987654321"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    readOnly 
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Forwarding Status</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${agent.forwardingStatus === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {agent.forwardingStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <p className="text-sm text-slate-400">No agents found for this tenant.</p>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black text-white">Integration Settings</h2>
          <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-6 space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">WhatsApp Notifications</label>
              <p className="text-slate-200 mt-1">{integration?.whatsappNotificationsEnabled ? "Enabled" : "Disabled"}</p>
            </div>
            {integration?.whatsappNotificationsEnabled && (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Staff WhatsApp Number</label>
                <p className="text-slate-200 mt-1">{integration?.staffWhatsAppNumber || "Not configured"}</p>
              </div>
            )}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Last Webhook At</label>
              <p className="text-slate-200 mt-1">{integration?.lastWebhookAt ? new Date(integration.lastWebhookAt).toLocaleString() : "Never"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
