import { prisma } from "@/lib/prisma";
import { requirePlatformAdminPage } from "@/lib/security/guards";

export default async function PlatformAuditPage() {
  await requirePlatformAdminPage();

  const logs = await prisma.platformAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  const actionSummary = Object.entries(
    logs.reduce<Record<string, number>>((acc, log) => {
      acc[log.action] = (acc[log.action] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);

  const entitySummary = Object.entries(
    logs.reduce<Record<string, number>>((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 text-on-surface">
      <section className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Audit</p>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Operational and security summary</h1>
        <p className="text-sm text-muted-foreground">
          High-level visibility into platform-admin actions without exposing raw stack traces or tenant internals.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Recent audited actions</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-on-surface">{logs.length}</p>
        </div>
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Unique action types</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-on-surface">{actionSummary.length}</p>
        </div>
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Entity coverage</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-on-surface">{entitySummary.length}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-soft">
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-on-surface">Top actions</h2>
          <div className="mt-4 space-y-3">
            {actionSummary.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No platform audit actions recorded yet.</p>
            ) : (
              actionSummary.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                  <span className="text-sm font-bold text-on-surface">{entry.label}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-primary">{entry.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-soft">
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-on-surface">Entity focus</h2>
          <div className="mt-4 space-y-3">
            {entitySummary.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No entity activity recorded yet.</p>
            ) : (
              entitySummary.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                  <span className="text-sm font-bold text-on-surface">{entry.label}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-secondary">{entry.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
