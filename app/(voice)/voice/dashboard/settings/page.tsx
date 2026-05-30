export default function VoiceSettingsPage() {
  const panels = [
    ["Business Profile", "Receptionist display name, languages, timezone, and public response persona."],
    ["Office Hours", "Working hours, after-hours behavior, holiday closures, and emergency escalation rules."],
    ["Reception Script", "Opening greeting, caller qualification prompts, opt-out wording, and human handoff rules."],
    ["Compliance", "Consent language, recording disclosure, call retention, and future DNC controls."],
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {panels.map(([title, description]) => (
        <div key={title} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">{title}</div>
          <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>
          <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-slate-950/35 px-4 py-5 text-sm text-slate-400">
            Placeholder only. Settings storage and validation will be added when the receptionist schema is introduced.
          </div>
        </div>
      ))}
    </div>
  );
}
