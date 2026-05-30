const kbSections = [
  "Business FAQs",
  "Service and pricing summaries",
  "Appointment policies",
  "Escalation rules",
  "Do-not-answer boundaries",
];

export default function VoiceKnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">Knowledge base / FAQ</div>
        <h2 className="mt-3 text-2xl font-black text-white">Prepare the receptionist’s approved answers</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          This area will later manage FAQ articles, documents, escalation notes, and business rules used by the receptionist model. It stays isolated from ERP assistant prompts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kbSections.map((section) => (
          <div key={section} className="rounded-[26px] border border-white/10 bg-slate-950/35 p-5">
            <div className="text-lg font-black text-white">{section}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Placeholder ready for future markdown, uploads, or synced business knowledge sources.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
