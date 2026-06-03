import { getVoiceAuditLogs } from "@/modules/voice/audit/service";
import Link from "next/link";

export default async function AdminAuditLogsPage() {
  const logs = await getVoiceAuditLogs({ limit: 100 });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
        <h1 className="text-2xl font-black text-on-surface">Voice Audit Logs</h1>
        <Link href="/admin/command-center" className="text-sm font-bold text-primary hover:underline">
          &larr; Back to Command Center
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-lowest text-xs font-black uppercase tracking-widest text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 border-b border-outline-variant/20">Timestamp</th>
              <th className="px-4 py-3 border-b border-outline-variant/20">Action</th>
              <th className="px-4 py-3 border-b border-outline-variant/20">Organization</th>
              <th className="px-4 py-3 border-b border-outline-variant/20">Actor</th>
              <th className="px-4 py-3 border-b border-outline-variant/20">Status</th>
              <th className="px-4 py-3 border-b border-outline-variant/20">Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50">
                <td className="px-4 py-3 text-xs text-on-surface-variant">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-bold text-on-surface">{log.action}</td>
                <td className="px-4 py-3 font-mono text-[10px]">{log.organizationId}</td>
                <td className="px-4 py-3">{log.actorRole || "System"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${log.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-600" : "bg-error/10 text-error"}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
