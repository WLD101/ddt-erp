import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type CapacityBenchmarkReport } from "@/lib/monitoring/benchmarks";
import { getSystemHealthSnapshot } from "@/lib/monitoring/system-health";
import { getCollectiveSystemHealth } from "@/modules/admin/system-health/service";
import { requirePlatformAdminPage } from "@/lib/security/guards";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatBytes(value: number | null | undefined) {
  if (!value || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[index]}`;
}

function formatDuration(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) return "n/a";
  if ((value ?? 0) < 1000) return `${Math.round(value ?? 0)} ms`;
  return `${((value ?? 0) / 1000).toFixed(2)} s`;
}

function formatPercent(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) return "n/a";
  return `${Math.round(value ?? 0)}%`;
}

function uptimeLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
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

function BenchmarkGrid({ benchmark }: { benchmark: CapacityBenchmarkReport | null }) {
  if (!benchmark) {
    return (
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant">
        No benchmark results have been recorded yet. Run <code>npm run monitor:benchmark -- --organization=&lt;tenantId&gt;</code> from the app server to capture capacity baselines.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Last benchmark</p>
        <p className="mt-1 font-bold text-on-surface">{benchmark.organizationName}</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          {new Date(benchmark.generatedAt).toLocaleString()} · branch {benchmark.branchId}
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {benchmark.scenarios.map((scenario) => (
          <div key={scenario.size} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                {scenario.size.toLocaleString()}-record scenario
              </p>
              <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                actual sample {scenario.actualRows.toLocaleString()}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant">
              <div>Search: <span className="font-black text-on-surface">{formatDuration(scenario.timingsMs.search)}</span></div>
              <div>Exports: <span className="font-black text-on-surface">{formatDuration(scenario.timingsMs.exports)}</span></div>
              <div>Reports: <span className="font-black text-on-surface">{formatDuration(scenario.timingsMs.reports)}</span></div>
              <div>Dashboard: <span className="font-black text-on-surface">{formatDuration(scenario.timingsMs.dashboard)}</span></div>
              <div className="col-span-2">Assistant: <span className="font-black text-on-surface">{formatDuration(scenario.timingsMs.assistant)}</span></div>
            </div>
            {scenario.notes.length > 0 ? (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700">
                {scenario.notes.join(" ")}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function SystemHealthPage() {
  await requirePlatformAdminPage();
  const snapshot = await getSystemHealthSnapshot();
  const collective = await getCollectiveSystemHealth();

  const diskUsage = collective.server.diskUsagePercent;
  const ramUsage = collective.server.ramUsagePercent;

  let capacityStatus = "Healthy";
  let capacityTone = "default";
  
  if (diskUsage > 85 || ramUsage > 92) {
    capacityStatus = "Urgent";
    capacityTone = "critical";
  } else if (diskUsage > 75 || ramUsage > 85) {
    capacityStatus = "Plan Upgrade";
    capacityTone = "warning";
  } else if (diskUsage > 60 || ramUsage > 75) {
    capacityStatus = "Monitor";
    capacityTone = "warning";
  }

  const cpuTone =
    (snapshot.infrastructure.cpu.percent ?? 0) >= 80 ? "critical" : (snapshot.infrastructure.cpu.percent ?? 0) >= 65 ? "warning" : "default";
  const ramTone =
    snapshot.infrastructure.osMemory.usedPercent >= 85 ? "critical" : snapshot.infrastructure.osMemory.usedPercent >= 70 ? "warning" : "default";
  const diskTone =
    (snapshot.infrastructure.disk.usedPercent ?? 0) >= 75 ? "critical" : (snapshot.infrastructure.disk.usedPercent ?? 0) >= 60 ? "warning" : "default";
  const dbTone =
    snapshot.database.activity.activeQueries >= 8 || snapshot.database.activity.totalClientConnections >= snapshot.database.connectionPool.maxConnections * 0.8
      ? "critical"
      : snapshot.database.activity.activeQueries >= 4
        ? "warning"
        : "default";

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
                  Capacity Planning Console
                </h1>
                <p className="max-w-3xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">
                  Split infrastructure, database, and tenant load into separate signals so planning decisions stay grounded in real VPS pressure instead of blended percentages.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[480px]">
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Alert count</p>
                <p className="mt-3 text-3xl font-black tracking-tight">{snapshot.alerts.length}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Threshold breaches active right now.</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Probe latency</p>
                <p className="mt-3 text-3xl font-black tracking-tight">{formatDuration(snapshot.application.probe.responseTimeMs)}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Live auth-signin probe through localhost.</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Benchmark status</p>
                <p className="mt-3 text-3xl font-black tracking-tight">{snapshot.benchmarks.latest ? "Ready" : "Pending"}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Load-model baselines for search, export, report, dashboard, and assistant flows.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Capacity Status"
            value={capacityStatus}
            helper="Based on Disk & RAM thresholds"
            tone={capacityTone as "default" | "warning" | "critical"}
          />
          <MetricCard
            label="Service Status"
            value={collective.services.whatsqueryStatus === "active" ? "Running" : collective.services.whatsqueryStatus.slice(0, 15)}
            helper={`Nginx: ${collective.services.nginxStatus.slice(0, 15)}`}
          />
          <MetricCard
            label="ERP Tenants"
            value={collective.productUsage.erpTenantCount.toLocaleString()}
            helper={`${collective.productUsage.erp.customers.toLocaleString()} customers`}
          />
          <MetricCard
            label="Voice Businesses"
            value={collective.productUsage.voiceBusinessCount.toLocaleString()}
            helper={`${collective.productUsage.voice.agents.toLocaleString()} AI Agents`}
          />
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="CPU"
            value={formatPercent(snapshot.infrastructure.cpu.percent)}
            helper={`${snapshot.infrastructure.cpu.cores} cores · ${uptimeLabel(snapshot.infrastructure.cpu.uptimeSeconds)} uptime`}
            tone={cpuTone}
          />
          <MetricCard
            label="OS RAM"
            value={formatBytes(snapshot.infrastructure.osMemory.usedBytes)}
            helper={`${formatPercent(snapshot.infrastructure.osMemory.usedPercent)} of ${formatBytes(snapshot.infrastructure.osMemory.totalBytes)} used`}
            tone={ramTone}
          />
          <MetricCard
            label="App RAM"
            value={formatBytes(snapshot.infrastructure.appMemory.rssBytes)}
            helper={`Heap ${formatBytes(snapshot.infrastructure.appMemory.heapUsedBytes)} / ${formatBytes(snapshot.infrastructure.appMemory.heapTotalBytes)}`}
          />
          <MetricCard
            label="Disk"
            value={formatBytes(snapshot.infrastructure.disk.usedBytes)}
            helper={`${formatPercent(snapshot.infrastructure.disk.usedPercent)} of ${formatBytes(snapshot.infrastructure.disk.totalBytes)} used`}
            tone={diskTone}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Infrastructure Metrics</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Separate machine, app, Postgres memory, Nginx activity, disk, and network so platform pressure is easy to reason about.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">PostgreSQL memory settings</p>
                  <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                    <div>Shared buffers: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.postgresMemory.sharedBuffersBytes)}</span></div>
                    <div>Effective cache: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.postgresMemory.effectiveCacheSizeBytes)}</span></div>
                    <div>Work mem: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.postgresMemory.workMemBytes)}</span></div>
                    <div>Maintenance work mem: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.postgresMemory.maintenanceWorkMemBytes)}</span></div>
                    <div>Potential active work mem: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.postgresMemory.activeQueryWorkMemReservationBytes)}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Nginx + network</p>
                  <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                    <div>Requests last hour: <span className="font-black text-on-surface">{snapshot.infrastructure.nginx.requestsLastHour ?? "n/a"}</span></div>
                    <div>4xx / 5xx: <span className="font-black text-on-surface">{snapshot.infrastructure.nginx.fourHundredsLastHour ?? "n/a"} / {snapshot.infrastructure.nginx.fiveHundredsLastHour ?? "n/a"}</span></div>
                    <div>Avg request time: <span className="font-black text-on-surface">{formatDuration(snapshot.infrastructure.nginx.averageRequestTimeMsLastHour)}</span></div>
                    <div>Inbound: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.network?.receivedBytes)}</span></div>
                    <div>Outbound: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.network?.transmittedBytes)}</span></div>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Disk I/O</p>
                  <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                    <div>Read total: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.disk.io?.readBytes)}</span></div>
                    <div>Write total: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.disk.io?.writeBytes)}</span></div>
                    <div>Local uploads: <span className="font-black text-on-surface">{formatBytes(snapshot.infrastructure.localUploadsBytes)}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Backup + probe</p>
                  <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                    <div>Backup status: <span className="font-black text-on-surface">{snapshot.backups.status.toUpperCase()}</span></div>
                    <div>Last success: <span className="font-black text-on-surface">{snapshot.backups.lastSuccessAt ? new Date(snapshot.backups.lastSuccessAt).toLocaleString() : "Never"}</span></div>
                    <div>Redis: <span className="font-black text-on-surface">{snapshot.application.redisStatus.toUpperCase()}</span></div>
                    <div>Probe target: <span className="font-black text-on-surface">{snapshot.application.probe.target}</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Database Metrics</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Real active queries, idle states, pool posture, database size, slow queries, and top tables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard
                  label="Active Queries"
                  value={snapshot.database.activity.activeQueries.toLocaleString()}
                  helper={`${snapshot.database.activity.idleConnections.toLocaleString()} idle · ${snapshot.database.activity.idleInTransaction.toLocaleString()} idle in tx`}
                  tone={dbTone}
                />
                <MetricCard
                  label="Connection Pool"
                  value={`${snapshot.database.connectionPool.localClientConnections}/${snapshot.database.connectionPool.configuredAppPoolLimit ?? "?"}`}
                  helper={`DB max ${snapshot.database.connectionPool.maxConnections.toLocaleString()} · total clients ${snapshot.database.activity.totalClientConnections.toLocaleString()}`}
                  tone={dbTone}
                />
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Database size</p>
                <p className="mt-2 text-2xl font-black text-on-surface">{formatBytes(snapshot.database.sizeBytes)}</p>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Largest tables</p>
                <div className="space-y-2">
                  {snapshot.database.tableSizes.map((table) => (
                    <div key={table.tableName} className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
                      <span className="text-sm font-bold text-on-surface">{table.tableName}</span>
                      <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">{formatBytes(table.sizeBytes)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Slow queries</p>
                {snapshot.database.slowQueries.length === 0 ? (
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                    No query over the configured threshold has been captured yet.
                  </div>
                ) : (
                  snapshot.database.slowQueries.map((entry, index) => (
                    <div key={`${entry.timestamp}-${index}`} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest text-primary">{formatDuration(entry.durationMs)}</p>
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
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Tenant Metrics</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Products, customers, invoices, exports, reports, assistant usage, and storage attribution status by tenant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {snapshot.tenants.topOrganizations.map((tenant) => (
                <div key={tenant.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-on-surface">{tenant.name}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-widest text-on-surface-variant">{tenant.slug}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-on-surface">{tenant.totalRecords.toLocaleString()}</p>
                      <p className="text-[11px] text-on-surface-variant">tracked records</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant sm:grid-cols-4">
                    <div>Products: <span className="font-black text-on-surface">{tenant.counts.products}</span></div>
                    <div>Customers: <span className="font-black text-on-surface">{tenant.counts.customers}</span></div>
                    <div>Invoices: <span className="font-black text-on-surface">{tenant.counts.salesInvoices}</span></div>
                    <div>Purchases: <span className="font-black text-on-surface">{tenant.counts.purchaseInvoices}</span></div>
                    <div>Exports: <span className="font-black text-on-surface">{tenant.counts.exportRequests}</span></div>
                    <div>Reports: <span className="font-black text-on-surface">{tenant.reportActions}</span></div>
                    <div>Assistant: <span className="font-black text-on-surface">{tenant.assistantActions}</span></div>
                    <div>Storage: <span className="font-black text-on-surface">{tenant.storageStatus === "unmetered" ? "Not metered" : formatBytes(tenant.storageBytes)}</span></div>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700">
                {snapshot.tenants.storageNote}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Capacity Recommendations</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Actionable guidance from current infrastructure signals and the latest benchmark run.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {snapshot.recommendations.length === 0 ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700">
                  No urgent capacity actions are recommended right now.
                </div>
              ) : (
                snapshot.recommendations.map((recommendation) => (
                  <div key={`${recommendation.title}-${recommendation.priority}`} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-on-surface">{recommendation.title}</p>
                      <SeverityBadge severity={recommendation.priority} />
                    </div>
                    <p className="mt-2 text-sm text-on-surface-variant">{recommendation.detail}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Benchmark Harness</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Read-only operator benchmarks for 100, 500, 1,000, 5,000, and 10,000 row scenarios across search, exports, reports, dashboard, and assistant parsing.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <BenchmarkGrid benchmark={snapshot.benchmarks.latest} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Recent Alerts + Errors</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Threshold breaches and recent captured process errors from the live app runtime.
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
                        <p className="text-sm font-black text-on-surface">{alert.title}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{alert.detail}</p>
                      </div>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                  </div>
                ))
              )}

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recent application errors</p>
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
