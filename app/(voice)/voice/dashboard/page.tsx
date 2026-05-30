const readinessCards = [
  ["Business profile", "Placeholder ready", "Add business name, services, hours, languages, and transfer targets."],
  ["Call script", "Not configured", "Define opening greeting, qualification prompts, and fallback language policy."],
  ["Telephony", "Pending", "Vapi/Twilio credentials and webhook URLs will be added later."],
  ["Knowledge base", "Ready for upload", "Create FAQ groups and approved answer scope before going live."],
];

export default function VoiceDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-4">
        {readinessCards.map(([label, status, description]) => (
          <div key={label} className="rounded-[26px] border border-white/10 bg-slate-950/35 p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">{label}</div>
            <div className="mt-3 text-2xl font-black text-white">{status}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">Launch roadmap</div>
          <div className="mt-5 space-y-4">
            {[
              "Complete business onboarding",
              "Add reception goals: appointment booking, FAQs, lead capture, or routing only",
              "Configure call escalation contacts and office hours",
              "Approve knowledge base documents and FAQs",
              "Connect telephony provider and webhook endpoints",
            ].map((item, index) => (
              <div key={item} className="flex items-start gap-4 rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-slate-950">
                  {index + 1}
                </div>
                <div className="text-sm leading-6 text-slate-200">{item}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">Product boundaries</div>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <p>This workspace does not reuse the ERP Smart Assistant flow.</p>
            <p>It is reserved for inbound calls, receptionist-safe workflows, and telephony integrations.</p>
            <p>ERP data sync, call routing, and appointment booking remain future implementation steps.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
