"use client";

import Link from "next/link";

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
    receiptHref?: string | null;
    recordingHref?: string | null;
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
      <section className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">{badgeLabel}</div>
            <h2 className="mt-3 text-2xl font-black text-on-surface">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">{description}</p>
          </div>
          <div className="rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm font-black text-on-surface-variant">
            {rows.length} saved
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
        {rows.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-outline-variant/30 bg-surface-container-lowest px-5 py-10 text-center text-sm text-on-surface-variant">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-outline-variant/30 bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-lowest text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Caller</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Contact</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Request</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Notes</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Actions</th>
                    <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 bg-transparent">
                  {rows.map((row) => {
                    const getStatusVariant = (s: string): VoiceStatusVariant => {
                      if (s === "NEW") return "warning";
                      if (s === "CONTACTED") return "online";
                      if (s === "QUALIFIED") return "online";
                      if (s === "CLOSED") return "default";
                      return "default";
                    };

                    return (
                      <tr key={row.id} className="transition-colors hover:bg-surface-container-lowest">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="font-bold text-on-surface">{row.name || "Unknown caller"}</div>
                          <div className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant/60 mt-1">{row.source}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-on-surface">{row.phone || "-"}</div>
                          <div className="text-on-surface-variant text-xs mt-0.5">{row.email || "-"}</div>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant max-w-[200px] truncate" title={row.reasonForCall || ""}>
                          {row.reasonForCall || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <VoiceStatusPill variant={getStatusVariant(row.status)} label={row.status} />
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant max-w-xs truncate" title={row.notes || ""}>
                          {row.notes || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {row.receiptHref ? (
                              <Link
                                href={row.receiptHref}
                                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary hover:bg-primary/15"
                              >
                                Receipt
                              </Link>
                            ) : null}
                            {row.recordingHref ? (
                              <a
                                href={row.recordingHref}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant hover:text-primary"
                              >
                                Hear Call
                              </a>
                            ) : null}
                            {!row.receiptHref && !row.recordingHref ? (
                              <span className="text-xs text-on-surface-variant">-</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-on-surface-variant text-xs">
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
