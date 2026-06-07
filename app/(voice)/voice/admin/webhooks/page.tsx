import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminWebhooksPage() {
  const webhookEvents = await prisma.voiceWebhookEvent.findMany({
    orderBy: { receivedAt: "desc" },
    take: 50,
  });

  const orgIds = [...new Set(webhookEvents.map(evt => evt.organizationId).filter(Boolean) as string[])];
  const organizations = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true },
  });

  const orgMap = new Map(organizations.map(org => [org.id, org.name]));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface pb-12">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-on-surface">Voice Webhook Health</h1>
            <p className="text-sm text-on-surface-variant font-medium">Log of the 50 most recent webhook transactions from telephony providers.</p>
          </div>
          <Link href="/voice/admin/command-center">
            <Button variant="outline" className="h-10 rounded-2xl border-outline-variant/40 px-4 text-[11px] font-black uppercase tracking-[0.2em]">
              &larr; Back to Command Center
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-slate-900/5 text-xs font-black uppercase tracking-wider text-on-surface-variant">
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tenant Mapping</th>
                  <th className="p-4">Call ID</th>
                  <th className="p-4">Received At</th>
                  <th className="p-4">Details / Errors</th>
                </tr>
              </thead>
              <tbody>
                {webhookEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-on-surface-variant font-medium">
                      No webhook transactions logged yet.
                    </td>
                  </tr>
                ) : (
                  webhookEvents.map((evt) => (
                    <tr key={evt.id} className="border-b border-outline-variant/10 hover:bg-slate-900/5 transition-colors">
                      <td className="p-4 font-bold text-on-surface">{evt.eventType}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={
                          evt.status === "processed"
                            ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                            : evt.status === "failed"
                            ? "border-rose-500/30 text-rose-500 bg-rose-500/5"
                            : "border-amber-500/30 text-amber-500 bg-amber-500/5"
                        }>
                          {evt.status}
                        </Badge>
                      </td>
                      <td className="p-4 font-semibold text-xs text-on-surface-variant">
                        {evt.organizationId ? orgMap.get(evt.organizationId) || evt.organizationId : "Unmapped"}
                      </td>
                      <td className="p-4 font-mono text-xs text-on-surface-variant truncate max-w-[120px]" title={evt.providerCallId || ""}>
                        {evt.providerCallId || "N/A"}
                      </td>
                      <td className="p-4 text-xs text-on-surface-variant">
                        {new Date(evt.receivedAt).toLocaleString()}
                      </td>
                      <td className="p-4 max-w-xs">
                        {evt.errorMessage ? (
                          <div className="text-[10px] text-rose-600 bg-rose-50/50 p-2 rounded border border-rose-500/10 font-mono break-all leading-normal">
                            {evt.errorMessage}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Success
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
