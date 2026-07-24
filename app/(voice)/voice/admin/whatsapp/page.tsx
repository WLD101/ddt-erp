import { getWhatsappAdminOverview } from "@/modules/voice/whatsapp/service";

export default async function VoiceAdminWhatsappPage() {
  const { integrations, recentConversations, failedMessages, totals, envStatus } = await getWhatsappAdminOverview();

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Platform WhatsApp Command Center</p>
        <h1 className="mt-2 text-3xl font-black text-on-surface">WhatsApp AI Receptionist Monitor</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
          Super admin view for tenant mappings, failed messages, handoff load, and Cloud API readiness. Tenant data remains scoped in tenant dashboards.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Integrations</p>
          <p className="mt-2 text-3xl font-black text-on-surface">{totals.integrations}</p>
        </div>
        <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Enabled</p>
          <p className="mt-2 text-3xl font-black text-on-surface">{totals.enabledIntegrations}</p>
        </div>
        <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Conversations</p>
          <p className="mt-2 text-3xl font-black text-on-surface">{totals.conversations}</p>
        </div>
        <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Inbound messages</p>
          <p className="mt-2 text-3xl font-black text-on-surface">{totals.inboundMessages}</p>
        </div>
      </section>

      <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-5 text-sm leading-7 text-amber-900">
        Live WhatsApp sending is {envStatus.sendEnabled ? "enabled" : "disabled"}. Webhook URL:{" "}
        <span className="font-black">{envStatus.webhookUrl || "Set VOICE_PUBLIC_APP_URL"}</span>
      </div>

      <section className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
        <h2 className="text-xl font-black text-on-surface">Tenant mappings</h2>
        <div className="mt-5 overflow-hidden rounded-2xl border border-outline-variant/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Phone Number ID</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last webhook</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => (
                <tr key={integration.id} className="border-t border-outline-variant/20">
                  <td className="px-4 py-3 font-bold text-on-surface">{integration.organization.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{integration.phoneNumberId}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{integration.voiceAgent?.displayName || integration.voiceAgent?.name || "Default"}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{integration.status}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{integration.lastWebhookAt ? integration.lastWebhookAt.toLocaleString() : "Never"}</td>
                </tr>
              ))}
              {integrations.length === 0 ? (
                <tr><td className="px-4 py-6 text-on-surface-variant" colSpan={5}>No WhatsApp integrations configured yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
          <h2 className="text-xl font-black text-on-surface">Recent conversations</h2>
          <div className="mt-5 space-y-3">
            {recentConversations.map((conversation) => (
              <div key={conversation.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="font-black text-on-surface">{conversation.organization.name}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{conversation.contactName || conversation.contactWaId}: {conversation.lastMessagePreview || "No preview"}</p>
              </div>
            ))}
            {recentConversations.length === 0 ? <p className="text-sm text-on-surface-variant">No conversations yet.</p> : null}
          </div>
        </section>

        <section className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
          <h2 className="text-xl font-black text-on-surface">Failed or unsent replies</h2>
          <div className="mt-5 space-y-3">
            {failedMessages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-black text-on-surface">{message.organization.name}</p>
                  <span className="text-xs font-bold text-amber-700">{message.status}</span>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">{message.errorMessage || message.body || "No details"}</p>
              </div>
            ))}
            {failedMessages.length === 0 ? <p className="text-sm text-on-surface-variant">No failed WhatsApp messages.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
