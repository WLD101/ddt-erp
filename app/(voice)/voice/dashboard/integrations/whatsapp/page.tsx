import Link from "next/link";

import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { listVoiceAgents } from "@/modules/voice/agents/service";
import { saveWhatsappIntegrationAction, createWhatsappTemplateAction } from "@/modules/voice/whatsapp/actions";
import { getWhatsappTenantOverview } from "@/modules/voice/whatsapp/service";

export default async function VoiceWhatsappIntegrationPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const [{ integrations, envStatus }, voiceAgents] = await Promise.all([
    getWhatsappTenantOverview(ctx.organizationId),
    listVoiceAgents(ctx.organizationId),
  ]);
  const integration = integrations[0] || null;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">WhatsApp AI Receptionist</p>
            <h1 className="mt-2 text-3xl font-black text-on-surface">WhatsApp Business Platform</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
              Connect a WhatsApp Business phone number to the same WhatsQuery Voice training profile. Replies are tenant-scoped and never use another business&apos;s data.
            </p>
          </div>
          <Link href="/voice/dashboard/whatsapp/inbox" className="rounded-2xl bg-primary px-4 py-3 text-sm font-black text-on-primary shadow-soft">
            Open Inbox
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <form action={saveWhatsappIntegrationAction} className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
          <h2 className="text-xl font-black text-on-surface">Integration settings</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Tokens are encrypted and never rendered back into this form. Leave token fields blank to keep existing stored values.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-bold text-on-surface">
              WhatsApp Business Account ID
              <input name="whatsappBusinessAccountId" defaultValue={integration?.whatsappBusinessAccountId || ""} className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm font-bold text-on-surface">
              Phone Number ID
              <input name="phoneNumberId" required defaultValue={integration?.phoneNumberId || ""} className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm font-bold text-on-surface">
              Display name
              <input name="phoneNumberDisplayName" defaultValue={integration?.phoneNumberDisplayName || ""} className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm font-bold text-on-surface">
              Assigned VoiceAgent
              <select name="voiceAgentId" defaultValue={integration?.voiceAgentId || ""} className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary">
                <option value="">Use default agent</option>
                {voiceAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.displayName || agent.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-bold text-on-surface">
              Access token
              <input name="accessToken" type="password" placeholder={integration?.accessTokenEncrypted ? "Stored securely" : "Paste token"} className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm font-bold text-on-surface">
              Webhook verify token
              <input name="webhookVerifyToken" type="password" placeholder={integration?.webhookVerifyTokenHash ? "Stored securely" : "Create verify token"} className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="space-y-2 text-sm font-bold text-on-surface md:col-span-2">
              Staff WhatsApp notification number
              <input name="staffNotificationNumber" defaultValue={integration?.staffNotificationNumber || ""} className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
            </label>
          </div>

          <label className="mt-5 flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 text-sm font-bold text-on-surface">
            <input name="isEnabled" type="checkbox" defaultChecked={integration?.isEnabled || false} className="h-5 w-5" />
            Enable WhatsApp AI replies for this tenant
          </label>

          <button type="submit" className="mt-6 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-on-primary shadow-soft">
            Save WhatsApp setup
          </button>
        </form>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
            <h2 className="text-xl font-black text-on-surface">Webhook status</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Webhook URL</dt><dd className="max-w-[260px] break-all text-right font-bold text-on-surface">{envStatus.webhookUrl || "Set VOICE_PUBLIC_APP_URL"}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Live sending</dt><dd className="font-bold text-on-surface">{envStatus.sendEnabled ? "Enabled" : "Disabled"}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Meta status</dt><dd className="font-bold text-on-surface">{integration?.webhookStatus || "Not verified"}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Last webhook</dt><dd className="font-bold text-on-surface">{integration?.lastWebhookAt ? integration.lastWebhookAt.toLocaleString() : "Never"}</dd></div>
            </dl>
          </div>

          <form action={createWhatsappTemplateAction} className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
            <h2 className="text-xl font-black text-on-surface">Template placeholder</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Use approved templates later for messages outside the 24-hour service window.</p>
            <div className="mt-5 space-y-3">
              <input name="name" placeholder="callback_followup" className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
              <input name="language" placeholder="en" defaultValue="en" className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
              <input name="category" placeholder="UTILITY" className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
              <textarea name="body" placeholder="Thanks for contacting us. Our team will follow up shortly." className="min-h-24 w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary" />
            </div>
            <button type="submit" className="mt-4 rounded-2xl border border-outline-variant/40 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-on-surface">
              Save template draft
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
