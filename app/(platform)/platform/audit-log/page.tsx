import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminPage } from "@/lib/security/guards";

type SearchParams = Promise<{
  q?: string;
  page?: string;
  startDate?: string;
  endDate?: string;
}>;

const PAGE_SIZE = 25;

export default async function PlatformAuditLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformAdminPage();
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() || "";
  const startDate = params.startDate?.trim() || "";
  const endDate = params.endDate?.trim() || "";

  const logs = await prisma.platformAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const filteredLogs = logs.filter((log) => {
    const matchesQuery =
      !query ||
      [log.action, log.entityType, log.entityId, log.details]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    const createdAt = new Date(log.createdAt);
    const matchesStart = !startDate || createdAt >= new Date(startDate);
    const matchesEnd = !endDate || createdAt <= new Date(`${endDate}T23:59:59.999Z`);
    return matchesQuery && matchesStart && matchesEnd;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(params.page || "1") || 1), totalPages);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 text-on-surface">
      <section className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Audit log</p>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Raw platform event history</h1>
        <p className="text-sm text-muted-foreground">Detailed platform-admin action history with safe filtering and pagination.</p>
      </section>

      <form className="grid gap-3 rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft md:grid-cols-[1.2fr,0.7fr,0.7fr,auto]">
        <input
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search action, entity type, entity id, or details"
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        />
        <input
          name="startDate"
          type="date"
          defaultValue={startDate}
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        />
        <input
          name="endDate"
          type="date"
          defaultValue={endDate}
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        />
        <div className="flex gap-2">
          <Button type="submit" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            Apply
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            <a href="/platform/audit-log">Reset</a>
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
        <table className="w-full">
          <thead className="border-b border-outline-variant/30 bg-surface-container-lowest">
            <tr className="text-left text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Entity</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">When</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground">
                  No platform audit events match the current filters.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="border-b border-outline-variant/20 align-top">
                  <td className="px-6 py-4 text-sm font-black text-on-surface">{log.action}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    <div>{log.entityType}</div>
                    <div className="mt-1 font-mono text-xs">{log.entityId}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{log.details || "No extra details recorded."}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-3xl border border-outline-variant/30 bg-surface p-4 shadow-soft">
          <p className="text-sm text-on-surface-variant">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-2xl">
              <a href={`/platform/audit-log?q=${encodeURIComponent(params.q || "")}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&page=${Math.max(1, currentPage - 1)}`}>
                Previous
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl">
              <a href={`/platform/audit-log?q=${encodeURIComponent(params.q || "")}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&page=${Math.min(totalPages, currentPage + 1)}`}>
                Next
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
