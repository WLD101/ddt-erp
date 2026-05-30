const integrationRows = [
  {
    title: "Vapi",
    envs: ["VOICE_VAPI_API_KEY", "VOICE_VAPI_ASSISTANT_ID", "VOICE_VAPI_PHONE_NUMBER_ID"],
    note: "Reserved for live voice agent orchestration later.",
  },
  {
    title: "Twilio",
    envs: ["VOICE_TWILIO_ACCOUNT_SID", "VOICE_TWILIO_AUTH_TOKEN", "VOICE_TWILIO_PHONE_NUMBER"],
    note: "Reserved for SIP, call forwarding, or programmable voice routing later.",
  },
  {
    title: "Calendars / CRM",
    envs: ["VOICE_CALENDAR_PROVIDER", "VOICE_CRM_WEBHOOK_URL"],
    note: "Placeholder for booking sync and lead handoff integration.",
  },
];

export default function VoiceIntegrationsPage() {
  return (
    <div className="space-y-5">
      {integrationRows.map((row) => (
        <div key={row.title} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">Integration placeholder</div>
              <h2 className="mt-2 text-2xl font-black text-white">{row.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{row.note}</p>
            </div>
            <div className="rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-amber-100">
              Configuration required
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {row.envs.map((envName) => (
              <div key={envName} className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{envName}</div>
                <div className="mt-2 text-sm text-slate-300">Not configured in this foundation checkpoint.</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
