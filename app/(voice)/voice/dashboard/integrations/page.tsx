import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getVoiceIntegrationsOverview } from "@/modules/voice/service";

const integrationCards = [
  {
    key: "vapi",
    title: "Vapi",
    description: "Future telephony + AI conversation provider",
    envs: ["VOICE_VAPI_API_KEY", "VOICE_VAPI_ASSISTANT_ID", "VOICE_VAPI_PHONE_NUMBER_ID"],
  },
  {
    key: "twilio",
    title: "Twilio",
    description: "Future PSTN calling, phone numbers, and webhook ingestion",
    envs: ["VOICE_TWILIO_ACCOUNT_SID", "VOICE_TWILIO_AUTH_TOKEN", "VOICE_TWILIO_PHONE_NUMBER"],
  },
  {
    key: "googleCalendar",
    title: "Google Calendar",
    description: "Future appointment booking and availability sync",
    envs: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  {
    key: "whatsapp",
    title: "WhatsApp follow-up",
    description: "Future post-call follow-up workflow",
    envs: ["VOICE_WHATSAPP_FOLLOW_UP_WEBHOOK_URL"],
  },
] as const;

export default async function VoiceIntegrationsPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const { settings, envStatus } = await getVoiceIntegrationsOverview(ctx.organizationId);

  const currentStatuses = {
    vapi: settings?.vapiStatus ?? "NOT_CONNECTED",
    twilio: settings?.twilioStatus ?? "NOT_CONNECTED",
    googleCalendar: settings?.googleCalendarStatus ?? "NOT_CONNECTED",
    whatsapp: settings?.whatsappFollowUpStatus ?? "NOT_CONNECTED",
  } as const;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-amber-400/30 bg-amber-500/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-200">Production warning</div>
            <h2 className="mt-2 text-2xl font-black text-white">Calling is not live yet</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
              Vapi, Twilio, Google Calendar, and WhatsApp follow-up remain placeholder configurations in this phase. The dashboard can store readiness status, but no real phone calls, webhook ingestion, booking sync, or follow-up automation is active yet.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm font-semibold text-slate-200">
            Status: foundation only
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300">
        These are config placeholders only. This phase checks environment readiness and stores integration status separately from the ERP. It does not make live provider calls yet.
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        {integrationCards.map((card) => {
          const enabled = envStatus[card.key];
          const status = currentStatuses[card.key];

          return (
            <div key={card.key} className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">{card.title}</div>
                  <h2 className="mt-2 text-2xl font-black text-white">{status.replaceAll("_", " ")}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.description}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${
                    enabled ? "bg-emerald-400/15 text-emerald-200" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {enabled ? "ENV READY" : "CONFIG REQUIRED"}
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Expected environment variables</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {card.envs.map((envName) => (
                    <span key={envName} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                      {envName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
