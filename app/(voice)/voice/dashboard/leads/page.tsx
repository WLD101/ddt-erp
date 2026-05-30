export default function VoiceLeadsPage() {
  const cards = [
    ["Lead capture", "Caller name, phone, reason for calling, urgency, and follow-up ownership."],
    ["Appointments", "Preferred dates, service type, callback windows, and booking outcome."],
    ["Missed calls", "Queue for recovery workflows and human follow-up."],
    ["Disposition analytics", "Qualified lead, booked call, transferred call, or unresolved inquiry."],
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {cards.map(([title, description]) => (
        <div key={title} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">{title}</div>
          <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
          <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-slate-950/35 px-4 py-5 text-sm text-slate-400">
            Placeholder only. CRM sync, scheduling integrations, and lead workflows are not connected yet.
          </div>
        </div>
      ))}
    </div>
  );
}
