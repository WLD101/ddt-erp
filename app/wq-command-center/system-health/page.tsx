import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSystemHealthSnapshot } from "@/lib/monitoring/system-health";
import { requirePlatformAdminPage } from "@/lib/security/guards";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDuration(value: number) {
  if (!Number.isFinite(value)) return "n/a";
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

function SeverityBadge({ severity }: { severity: "info" | "warning" | "critical" }) {
  const className =
    severity === "critical"
      ? "border-error/30 bg-error/10 text-error"
      : severity === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";

  return (
    <Badge variant="outline" className={cn("uppercase tracking-[0.16em]", className)}>
      {severity}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "warning" | "critical";
}) {
  const toneClassName =
    tone === "critical"
      ? "text-error"
      : tone === "warning"
        ? "text-amber-700"
        : "text-on-surface";

  return (
    <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-black tracking-tight", toneClassName)}>{value}</div>
        <p className="mt-1 text-xs text-on-surface-variant">{helper}</p>
      </CardContent>
    </Card>
  );
}

export default async function SystemHealthPage() {
  await requirePlatformAdminPage();
  const snapshot = await getSystemHealthSnapshot();

  const cpuPercent = snapshot.infrastructure.cpuPercent ?? 0;
  const diskPercent = snapshot.infrastructure.diskPercent ?? 0;
  const dbConnectionPercent = snapshot.database.dbConnectionPercent ?? 0;
  const cpuTone = cpuPercent >= 80 ? "critical" : cpuPercent >= 65 ? "warning" : "default";
  const ramTone = snapshot.infrastructure.ramPercent >= 85 ? "critical" : snapshot.infrastructure.ramPercent >= 70 ? "warning" : "default";
  const diskTone = diskPercent >= 75 ? "critical" : diskPercent >= 60 ? "warning" : "default";
  const dbTone = dbConnectionPercent >= 80 ? "critical" : dbConnectionPercent >= 65 ? "warning" : "default";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] pb-12 text-on-surface">
      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        <section className="overflow-hidden rounded-[32px] border border-outline-variant/30 bg-linear-to-br from-surface via-surface to-surface-container-low shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 px-8 py-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20">
                System Health
              </Badge>
              <div className="space-y-3">
                <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight sm:text-5xl">
                  <span className="material-symbols-outlined text-[34px] text-primary sm:text-[40px]">monitor_heart</span>
                  VPS + Database Oversight
                </h1>
                <p className="max-w-3xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">
                  Internal-only operational health for shared VPS infrastructure, PostgreSQL capacity, backup posture, and tenant footprint concentration.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Alert count</p>
                <p className="mt-3 text-3xl font-black tracking-tight">{snapshot.alerts.length}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Threshold breaches active right now.</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Response time</p>
                <p className="mt-3 text-3xl font-black tracking-tight">{formatDuration(snapshot.application.responseTimeMs)}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Synthetic probe against the live app.</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">DB usage</p>
                <p className="mt-3 text-3xl font-black tracking-tight">{formatPercent(dbConnectionPercent)}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Current PostgreSQL connection pressure.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="CPU Utilization" value={formatPercent(cpuPercent)} helper={`${osLabel(snapshot.infrastructure.uptimeSeconds)} uptime`} tone={cpuTone} />
          <MetricCard label="RAM Utilization" value={formatPercent(snapshot.infrastructure.ramPercent)} helper={`${snapshot.infrastructure.totalMemoryGb - snapshot.infrastructure.freeMemoryGb} GB used of ${snapshot.infrastructure.totalMemoryGb} GB`} tone={ramTone} />
          <MetricCard label="Disk Utilization" value={formatPercent(diskPercent)} helper={`${snapshot.infrastructure.diskUsedGb ?? 0} GB used of ${snapshot.infrastructure.diskTotalGb ?? 0} GB`} tone={diskTone} />
          <MetricCard label="Database Size" value={`${snapshot.database.databaseSizeGb ?? 0} GB`} helper={`${snapshot.database.currentConnections}/${snapshot.database.maxConnections} active connections`} tone={dbTone} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Alert Thresholds</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Configured system warnings based on shared-VPS protection thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {snapshot.alerts.length === 0 ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700">
                  No active threshold breaches. The stack is operating inside configured headroom.
                </div>
              ) : (
                snapshot.alerts.map((alert) => (
                  <div key={`${alert.key}-${alert.title}`} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{alert.title}</p>
                        <p className="mt-1 text-sm font-bold text-on-surface">{alert.detail}</p>
                      </div>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Backup + Edge Health</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Backup heartbeat, Nginx edge behavior, and app probe timing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 text-sm">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Backup Status</p>
                <p className="mt-2 text-lg font-black text-on-surface">{snapshot.backups.status.toUpperCase()}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {snapshot.backups.lastSuccessAt
                    ? `Last successful heartbeat: ${new Date(snapshot.backups.lastSuccessAt).toLocaleString()}`
                    : "No successful backup heartbeat recorded yet."}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Nginx 4xx / 5xx</p>
                  <p className="mt-2 text-xl font-black text-on-surface">
                    {snapshot.application.nginx.fourHundredsLastHour ?? "n/a"} / {snapshot.application.nginx.fiveHundredsLastHour ?? "n/a"}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">Observed over the last hour.</p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">App Probe</p>
                  <p className="mt-2 text-xl font-black text-on-surface">{formatDuration(snapshot.application.responseTimeMs)}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">Redis: {snapshot.application.redisStatus.toUpperCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">PostgreSQL Health</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Connections, slow-query samples, and table-size concentration for the current shared database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Connections</p>
                  <p className="mt-2 text-2xl font-black text-on-surface">
                    {snapshot.database.currentConnections} / {snapshot.database.maxConnections}
                  </p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Redis Status</p>
                  <p className="mt-2 text-2xl font-black text-on-surface">{snapshot.application.redisStatus.toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Largest Tables</p>
                <div className="space-y-2">
                  {snapshot.database.tableSizes.map((table) => (
                    <div key={table.tableName} className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
                      <span className="text-sm font-bold text-on-surface">{table.tableName}</span>
                      <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">{table.sizeGb} GB</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recent Slow Queries</p>
                {snapshot.database.slowQueries.length === 0 ? (
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                    No query over the configured threshold has been captured yet.
                  </div>
                ) : (
                  snapshot.database.slowQueries.map((entry, index) => (
                    <div key={`${entry.timestamp}-${index}`} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest text-primary">{formatDuration(entry.durationMs ?? 0)}</p>
                        <p className="text-[11px] text-on-surface-variant">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-on-surface-variant">
                        {entry.queryPreview}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Tenant Footprint</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Top tenants by combined record volume to spot concentration risk before migrations or infra scaling.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {snapshot.tenants.length === 0 ? (
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  No tenant record volume available yet.
                </div>
              ) : (
                snapshot.tenants.map((tenant) => (
                  <div key={tenant.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-on-surface">{tenant.name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-widest text-on-surface-variant">{tenant.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-on-surface">
                          {(tenant.counts.members + tenant.counts.branches + tenant.counts.customers + tenant.counts.suppliers + tenant.counts.products + tenant.counts.salesInvoices + tenant.counts.purchaseInvoices + tenant.counts.exportRequests).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">tracked records</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant sm:grid-cols-4">
                      <div>Users: <span className="font-black text-on-surface">{tenant.counts.members}</span></div>
                      <div>Branches: <span className="font-black text-on-surface">{tenant.counts.branches}</span></div>
                      <div>Customers: <span className="font-black text-on-surface">{tenant.counts.customers}</span></div>
                      <div>Suppliers: <span className="font-black text-on-surface">{tenant.counts.suppliers}</span></div>
                      <div>Products: <span className="font-black text-on-surface">{tenant.counts.products}</span></div>
                      <div>Sales: <span className="font-black text-on-surface">{tenant.counts.salesInvoices}</span></div>
                      <div>Purchases: <span className="font-black text-on-surface">{tenant.counts.purchaseInvoices}</span></div>
                      <div>Exports: <span className="font-black text-on-surface">{tenant.counts.exportRequests}</span></div>
                    </div>
                  </div>
                ))
              )}

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recent Application Errors</p>
                {snapshot.application.recentErrors.length === 0 ? (
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                    No captured process-level errors in the recent log window.
                  </div>
                ) : (
                  snapshot.application.recentErrors.map((entry, index) => (
                    <div key={`${entry.timestamp}-${index}`} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-error">{entry.source || "error"}</p>
                        <p className="text-[11px] text-on-surface-variant">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="mt-2 text-sm font-bold text-on-surface">{entry.message || "Unknown application error"}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function osLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}
