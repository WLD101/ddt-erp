export default function VoiceCallLogsPage() {
  const columns = ["Caller", "Outcome", "Language", "Assigned to", "Appointment", "Captured at"];

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">Call logs placeholder</div>
        <h2 className="mt-3 text-2xl font-black text-white">Inbound conversations will appear here once telephony is connected</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          This page is reserved for caller timelines, transcripts, missed-call recovery, escalations, dispositions, and QA review. No fake call rows are being created.
        </p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
        <div className="grid grid-cols-6 border-b border-white/10 px-6 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
          {columns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        <div className="px-6 py-10 text-sm text-slate-300">
          No calls yet. Add telephony credentials, webhook endpoints, and call-routing workflows before this table goes live.
        </div>
      </div>
    </div>
  );
}
