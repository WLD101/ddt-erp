"use client";

type VoiceRequestQueueProps = {
  title: string;
  description: string;
  emptyMessage: string;
  badgeLabel: string;
  rows: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    reasonForCall: string | null;
    status: string;
    notes: string | null;
    source: string;
    createdAt: string;
  }>;
};

export function VoiceRequestQueue({
  title,
  description,
  emptyMessage,
  badgeLabel,
  rows,
}: VoiceRequestQueueProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">{badgeLabel}</div>
            <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
          </div>
          <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-200">
            {rows.length} saved
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
        {rows.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-300">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-slate-950/45 text-slate-300">
                <tr>
                  {["Caller", "Phone", "Email", "Request", "Source", "Status", "Notes", "Created"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.22em]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-white/5 text-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">{row.name || "Unknown caller"}</td>
                    <td className="px-4 py-3">{row.phone || "-"}</td>
                    <td className="px-4 py-3">{row.email || "-"}</td>
                    <td className="px-4 py-3">{row.reasonForCall || "-"}</td>
                    <td className="px-4 py-3">{row.source}</td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="max-w-md px-4 py-3 whitespace-pre-wrap">{row.notes || "-"}</td>
                    <td className="px-4 py-3">{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
