import Link from "next/link";

import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getVoiceIntegrationsOverview } from "@/modules/voice/service";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";

const integrationCards = [
  {
    key: "vapi",
    title: "AI Receptionist (Voice Engine)",
    description: "Manage your AI receptionist, webhook configuration, and prompts.",
    envs: ["VAPI_PRIVATE_API_KEY", "VAPI_PUBLIC_KEY", "VAPI_WEBHOOK_SECRET", "VAPI_SERVER_URL", "VOICE_PUBLIC_APP_URL"],
  },
  {
    key: "twilio",
    title: "Twilio Telephony Provider",
    description: "Connect your Twilio account to easily configure custom Pakistani or international numbers to route calls.",
    envs: ["VOICE_TWILIO_ACCOUNT_SID", "VOICE_TWILIO_AUTH_TOKEN", "VOICE_TWILIO_PHONE_NUMBER"],
  },
  {
    key: "googleCalendar",
    title: "Google Calendar",
    description: "Future appointment booking and availability sync.",
    envs: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  {
    key: "whatsapp",
    title: "WhatsApp AI Receptionist",
    description: "Connect WhatsApp Business Platform for tenant-scoped AI replies, lead capture, order requests, and handoffs.",
    envs: ["VOICE_PUBLIC_APP_URL", "VOICE_WHATSAPP_WEBHOOK_VERIFY_TOKEN", "VOICE_WHATSAPP_SEND_ENABLED"],
  },
  {
    key: "stripe",
    title: "Stripe Payments",
    description: "Accept secure credit card payments over the phone for reservations or orders.",
    envs: ["STRIPE_SECRET_KEY"],
  },
  {
    key: "slack",
    title: "Slack Notifications",
    description: "Send automated alerts to Slack channels for missed calls, leads, and orders.",
    envs: ["SLACK_BOT_TOKEN", "SLACK_CHANNEL_ID"],
  },
  {
    key: "make",
    title: "Make.com Automations",
    description: "Trigger powerful multi-step automations across 1000+ apps via webhooks.",
    envs: ["MAKE_WEBHOOK_URL"],
  },
  {
    key: "hubspot",
    title: "HubSpot CRM",
    description: "Synchronize incoming callers, call summaries, and leads directly into HubSpot.",
    envs: ["HUBSPOT_ACCESS_TOKEN"],
  },
] as const;

export default async function VoiceIntegrationsPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const { settings, envStatus, voiceAgents } = await getVoiceIntegrationsOverview(ctx.organizationId);

  const currentStatuses = {
    vapi: settings?.vapiStatus ?? "NOT_CONNECTED",
    twilio: settings?.twilioStatus ?? "NOT_CONNECTED",
    googleCalendar: settings?.googleCalendarStatus ?? "NOT_CONNECTED",
    whatsapp: settings?.whatsappFollowUpStatus ?? "NOT_CONNECTED",
    stripe: "NOT_CONNECTED",
    slack: "NOT_CONNECTED",
    make: "NOT_CONNECTED",
    hubspot: "NOT_CONNECTED",
  } as Record<string, string>;

  const vapiStatus = getVapiEnvStatus();
  const defaultAgent = voiceAgents.find((agent) => agent.isDefault) || voiceAgents[0] || null;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800">Production warning</div>
            <h2 className="mt-2 text-2xl font-black text-on-surface">Calling is not live yet</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
              Voice Engine, Twilio, Google Calendar, and WhatsApp follow-up remain controlled demo configurations in this phase.
              The dashboard can store readiness status, but real phone calls, booking sync, and follow-up automation are not fully live until the provider setup is completed and verified.
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant">
            Status: foundation only
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 text-sm leading-7 text-on-surface-variant shadow-xs">
        These are provider configuration placeholders only. This phase checks environment readiness and stores integration status separately from the ERP.
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        {integrationCards.map((card) => {
          const enabled = envStatus[card.key];
          const status = currentStatuses[card.key];

          return (
            <div key={card.key} className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{card.title}</div>
                  <h2 className="mt-2 text-2xl font-black text-on-surface">{status.replaceAll("_", " ")}</h2>
                  <p className="mt-2 text-xs leading-6 text-on-surface-variant">{card.description}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                    enabled ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20" : "bg-outline-variant/40 text-on-surface-variant"
                  }`}
                >
                  {enabled ? "Env ready" : "Config required"}
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Expected environment variables</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {card.envs.map((envName) => (
                    <span key={envName} className="rounded-full border border-outline-variant/30 bg-surface px-3 py-1 text-xs font-semibold text-on-surface-variant shadow-xs">
                      {envName}
                    </span>
                  ))}
                </div>
              </div>

              {card.key === "vapi" ? (
                <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Engine status</div>
                    <Link href="/voice/dashboard/integrations/vapi" className="text-xs font-bold text-primary hover:underline">
                      Manage setup →
                    </Link>
                  </div>
                  <ul className="space-y-2 text-sm text-on-surface-variant">
                    <li className="flex justify-between"><span>API Keys</span><span className="font-semibold text-on-surface">{vapiStatus.hasPrivateKey && vapiStatus.hasPublicKey ? "Connected" : "Missing"}</span></li>
                    <li className="flex justify-between"><span>Default Agent</span><span className="font-semibold text-on-surface">{defaultAgent?.name || "Missing"}</span></li>
                    <li className="flex justify-between"><span>Agent Assistant ID</span><span className="font-semibold text-on-surface">{defaultAgent?.vapiAssistantId ? "Configured" : "Missing"}</span></li>
                    <li className="flex justify-between"><span>Agent Phone Number ID</span><span className="font-semibold text-on-surface">{defaultAgent?.vapiPhoneNumberId ? "Configured" : "Missing"}</span></li>
                    <li className="flex justify-between"><span>telephony phone number</span><span className="font-semibold text-primary">{defaultAgent?.vapiPhoneNumberName || "Not assigned"}</span></li>
                    <li className="flex justify-between"><span>Webhook Secret</span><span className="font-semibold text-on-surface">{vapiStatus.hasWebhookSecret ? "Secured" : "Recommended"}</span></li>
                    <li className="flex justify-between"><span>Agent Mapping</span><span className="font-semibold text-on-surface">{defaultAgent?.vapiAssistantId || defaultAgent?.vapiPhoneNumberId ? "Configured" : "Missing"}</span></li>
                    <li className="flex justify-between"><span>Live Calling</span><span className="font-semibold text-on-surface">{vapiStatus.callingEnabled ? "Enabled" : "Disabled"}</span></li>
                  </ul>
                  <div className="mt-4 border-t border-outline-variant/20 pt-4">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Webhook URL</div>
                    <code className="block break-all rounded-xl border border-outline-variant/30 bg-surface p-3 text-xs font-bold text-amber-700 select-all">
                      {vapiStatus.webhookUrl || "Configure VOICE_PUBLIC_APP_URL"}
                    </code>
                  </div>
                  {!vapiStatus.callingEnabled ? (
                    <div className="mt-3 text-xs font-semibold text-amber-700">
                      Calling is currently disabled. Keep it disabled until the assistant and phone number are fully ready for the demo.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {card.key === "twilio" ? (
                <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Twilio status</div>
                    <Link href="/voice/dashboard/integrations/twilio" className="text-xs font-bold text-primary hover:underline">
                      Manage setup →
                    </Link>
                  </div>
                  {settings?.twilioStatus === "CONNECTED" && settings?.providerConfigNotes ? (
                    (() => {
                      try {
                        const parsed = JSON.parse(settings.providerConfigNotes);
                        const accountSid = typeof parsed.accountSid === "string" ? parsed.accountSid : "";
                        const phoneNumber = typeof parsed.phoneNumber === "string" ? parsed.phoneNumber : "";
                        return (
                          <ul className="space-y-2 text-sm text-on-surface-variant">
                            <li className="flex justify-between"><span>Account SID</span><span className="font-semibold text-on-surface">{accountSid ? `...${accountSid.slice(-8)}` : "Configured"}</span></li>
                            <li className="flex justify-between"><span>Twilio Phone Number</span><span className="font-semibold text-primary">{phoneNumber || "Configured"}</span></li>
                            <li className="flex justify-between"><span>Auth Token</span><span className="font-semibold text-on-surface">Stored securely</span></li>
                            <li className="flex justify-between"><span>Status</span><span className="font-bold text-emerald-500">CONNECTED</span></li>
                          </ul>
                        );
                      } catch {
                        return <p className="text-xs text-on-surface-variant">Twilio credentials configured.</p>;
                      }
                    })()
                  ) : (
                    <p className="text-xs text-on-surface-variant">No Twilio credentials configured. Connect a Twilio account to get an active Pakistani call-forwarding route.</p>
                  )}
                </div>
              ) : null}

              {card.key === "whatsapp" ? (
                <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">WhatsApp channel</div>
                    <Link href="/voice/dashboard/integrations/whatsapp" className="text-xs font-bold text-primary hover:underline">
                      Manage setup →
                    </Link>
                  </div>
                  <ul className="space-y-2 text-sm text-on-surface-variant">
                    <li className="flex justify-between"><span>Tenant mapping</span><span className="font-semibold text-on-surface">Phone Number ID required</span></li>
                    <li className="flex justify-between"><span>AI replies</span><span className="font-semibold text-on-surface">Business training profile</span></li>
                    <li className="flex justify-between"><span>Live sending</span><span className="font-semibold text-on-surface">{process.env.VOICE_WHATSAPP_SEND_ENABLED === "true" ? "Enabled" : "Disabled"}</span></li>
                    <li className="flex justify-between"><span>ERP writes</span><span className="font-semibold text-on-surface">Disabled</span></li>
                  </ul>
                </div>
              ) : null}

              {["stripe", "slack", "make", "hubspot"].includes(card.key) ? (
                <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Setup required</div>
                    <Link href={`/voice/dashboard/integrations/${card.key}`} className="text-xs font-bold text-primary hover:underline">
                      Manage setup →
                    </Link>
                  </div>
                  <p className="text-xs text-on-surface-variant">This is a one-click integration placeholder for {card.title}. Production enablement will be available once the foundation phase is complete.</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
