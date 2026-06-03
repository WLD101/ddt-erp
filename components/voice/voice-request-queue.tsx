"use client";

import { VoiceStatusPill, type VoiceStatusVariant } from "@/components/voice/ui/voice-status-pill";

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

      <section className="rounded-[28px] border border-white/10 bg-slate-950/40 p-6 shadow-xl backdrop-blur">
        {rows.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/20 px-5 py-10 text-center text-sm text-slate-300">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40 shadow-xl backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Caller</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Contact</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Request</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Notes</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {rows.map((row) => {
                    const getStatusVariant = (s: string): VoiceStatusVariant => {
                      if (s === "NEW") return "warning";
                      if (s === "CONTACTED") return "online";
                      if (s === "QUALIFIED") return "online";
                      if (s === "CLOSED") return "default";
                      return "default";
                    };

                    return (
                      <tr key={row.id} className="transition-colors hover:bg-white/5">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="font-bold text-white">{row.name || "Unknown caller"}</div>
                          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mt-1">{row.source}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-slate-200">{row.phone || "-"}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{row.email || "-"}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate" title={row.reasonForCall || ""}>
                          {row.reasonForCall || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <VoiceStatusPill variant={getStatusVariant(row.status)} label={row.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-300 max-w-xs truncate" title={row.notes || ""}>
                          {row.notes || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-400 text-xs">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
