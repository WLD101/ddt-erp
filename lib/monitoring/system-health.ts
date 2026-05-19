import fs from "fs/promises";
import os from "os";
import path from "path";
import { performance } from "perf_hooks";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

import { readLatestCapacityBenchmark } from "./benchmarks";
import { MONITORING_PATHS, MONITORING_THRESHOLDS, getMonitoringProbeUrl } from "./config";
import { readRecentJsonLines } from "./logging";
import { getTopTenantUsageAnalytics } from "./tenant-usage";

type AlertSeverity = "info" | "warning" | "critical";

type HealthAlert = {
  key: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
};

type CapacityRecommendation = {
  title: string;
  detail: string;
  priority: AlertSeverity;
};

function toBytes(value: bigint | number | string | null | undefined) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

async function readOptionalText(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function readDirectorySizeBytes(directoryPath: string) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        total += (await readDirectorySizeBytes(fullPath)) ?? 0;
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        total += stats.size;
      }
    }
    return total;
  } catch {
    return null;
  }
}

async function readLinuxDiskIoTotals() {
  const text = await readOptionalText("/proc/diskstats");
  if (!text) return null;

  let readSectors = 0;
  let writtenSectors = 0;

  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 14) continue;
    const device = parts[2];
    if (!device || device.startsWith("loop") || device.startsWith("ram")) continue;
    readSectors += Number(parts[5] || 0);
    writtenSectors += Number(parts[9] || 0);
  }

  return {
    readBytes: readSectors * 512,
    writeBytes: writtenSectors * 512,
  };
}

async function readLinuxNetworkTotals() {
  const text = await readOptionalText("/proc/net/dev");
  if (!text) return null;

  let receivedBytes = 0;
  let transmittedBytes = 0;

  for (const line of text.split(/\r?\n/).slice(2)) {
    const [iface, metrics] = line.split(":");
    if (!iface || !metrics) continue;
    const name = iface.trim();
    if (name === "lo") continue;
    const values = metrics.trim().split(/\s+/);
    receivedBytes += Number(values[0] || 0);
    transmittedBytes += Number(values[8] || 0);
  }

  return {
    receivedBytes,
    transmittedBytes,
  };
}

async function readBackupHealth() {
  const text = await readOptionalText(MONITORING_PATHS.backupHealth);
  if (!text) {
    return {
      status: "unknown",
      lastSuccessAt: null as string | null,
      lastFailureAt: null as string | null,
      message: "No backup heartbeat file found yet.",
      stale: true,
    };
  }

  try {
    const parsed = JSON.parse(text) as {
      status?: string;
      lastSuccessAt?: string | null;
      lastFailureAt?: string | null;
      message?: string | null;
    };
    const lastSuccess = parsed.lastSuccessAt ? new Date(parsed.lastSuccessAt) : null;
    const stale =
      !lastSuccess ||
      Date.now() - lastSuccess.getTime() > MONITORING_THRESHOLDS.backupMaxAgeHours * 60 * 60 * 1000;

    return {
      status: parsed.status || "unknown",
      lastSuccessAt: parsed.lastSuccessAt || null,
      lastFailureAt: parsed.lastFailureAt || null,
      message: parsed.message || (stale ? "Backup heartbeat is stale." : "Backups healthy."),
      stale,
    };
  } catch {
    return {
      status: "invalid",
      lastSuccessAt: null as string | null,
      lastFailureAt: null as string | null,
      message: "Backup heartbeat file could not be parsed.",
      stale: true,
    };
  }
}

async function readNginxStatus() {
  const text = await readOptionalText(MONITORING_PATHS.nginxAccessLog);
  if (!text) {
    return {
      available: false,
      requestsLastHour: null as number | null,
      fourHundredsLastHour: null as number | null,
      fiveHundredsLastHour: null as number | null,
      averageRequestTimeMsLastHour: null as number | null,
    };
  }

  const since = Date.now() - 60 * 60 * 1000;
  let requests = 0;
  let fourHundreds = 0;
  let fiveHundreds = 0;
  let requestTimeTotal = 0;
  let requestTimeCount = 0;

  for (const line of text.split(/\r?\n/).slice(-5000)) {
    const timestampMatch = line.match(/\[(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
    if (!timestampMatch) continue;
    const [, day, mon, year, hour, minute, second] = timestampMatch;
    const parsedTime = Date.parse(`${day} ${mon} ${year} ${hour}:${minute}:${second} GMT`);
    if (!Number.isFinite(parsedTime) || parsedTime < since) continue;

    requests += 1;
    const statusMatch = line.match(/"\s(\d{3})\s/);
    const status = Number(statusMatch?.[1] || 0);
    if (status >= 400 && status < 500) fourHundreds += 1;
    if (status >= 500) fiveHundreds += 1;

    const requestTimeMatch = line.match(/\s(\d+\.\d+)\s*$/);
    if (requestTimeMatch?.[1]) {
      requestTimeTotal += Number(requestTimeMatch[1]) * 1000;
      requestTimeCount += 1;
    }
  }

  return {
    available: true,
    requestsLastHour: requests,
    fourHundredsLastHour: fourHundreds,
    fiveHundredsLastHour: fiveHundreds,
    averageRequestTimeMsLastHour: requestTimeCount > 0 ? Math.round(requestTimeTotal / requestTimeCount) : null,
  };
}

async function probeApplicationResponseTime() {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(getMonitoringProbeUrl(), {
      cache: "no-store",
      signal: controller.signal,
    });
    return {
      responseTimeMs: Math.round(performance.now() - started),
      statusCode: response.status,
      ok: response.ok || response.status === 307,
      target: getMonitoringProbeUrl(),
    };
  } catch {
    return {
      responseTimeMs: Math.round(performance.now() - started),
      statusCode: null as number | null,
      ok: false,
      target: getMonitoringProbeUrl(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseConfiguredPoolLimit() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const candidates = ["connection_limit", "pool_max", "pool"];
    for (const key of candidates) {
      const raw = parsed.searchParams.get(key);
      if (!raw) continue;
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function buildCapacityRecommendations(snapshot: Awaited<ReturnType<typeof getSystemHealthSnapshotBase>>): CapacityRecommendation[] {
  const recommendations: CapacityRecommendation[] = [];

  if (snapshot.infrastructure.osMemory.usedPercent >= 80) {
    recommendations.push({
      title: "OS memory headroom is getting tight",
      detail: "Plan to move PostgreSQL off-box first or split background workloads before RAM pressure starts affecting web response times.",
      priority: "critical",
    });
  }

  if (snapshot.database.slowQueries.length > 0 && snapshot.database.activity.activeQueries >= 3) {
    recommendations.push({
      title: "Investigate high-cost query paths",
      detail: "Recent slow queries are appearing while real active queries are running. Prioritize indexes and async report/export generation before scaling connections.",
      priority: "warning",
    });
  }

  if (snapshot.database.connectionPool.configuredAppPoolLimit && snapshot.database.connectionPool.localClientConnections >= snapshot.database.connectionPool.configuredAppPoolLimit) {
    recommendations.push({
      title: "Application pool is saturated",
      detail: "The app is already using all configured local pooled DB connections. Increase pool size only after validating PostgreSQL max_connections headroom.",
      priority: "critical",
    });
  }

  if (snapshot.infrastructure.disk.usedPercent !== null && snapshot.infrastructure.disk.usedPercent >= 70) {
    recommendations.push({
      title: "Disk growth needs cleanup planning",
      detail: "Review log rotation, local uploads, and export/report artifacts. Shared VPS disk should stay well below critical thresholds before migrations.",
      priority: "warning",
    });
  }

  if (!snapshot.benchmarks.latest) {
    recommendations.push({
      title: "Run the capacity benchmark harness",
      detail: "Execute `npm run monitor:benchmark -- --organization=<tenantId>` to capture search/export/report/dashboard/assistant timing baselines.",
      priority: "info",
    });
  } else {
    const scenarios = snapshot.benchmarks.latest.scenarios;
    const atFiveThousand = scenarios.find((scenario) => scenario.size === 5000) || scenarios[scenarios.length - 1];
    if (atFiveThousand) {
      if ((atFiveThousand.timingsMs.exports ?? 0) > 2000) {
        recommendations.push({
          title: "Move large exports to background execution",
          detail: `Export extraction at the ${atFiveThousand.size.toLocaleString()}-row scenario is taking ${atFiveThousand.timingsMs.exports}ms. Queue-based exports should become the default above this range.`,
          priority: "warning",
        });
      }

      if ((atFiveThousand.timingsMs.dashboard ?? 0) > 1000) {
        recommendations.push({
          title: "Cache dashboard summaries more aggressively",
          detail: `Dashboard benchmark time at ${atFiveThousand.size.toLocaleString()} rows is ${atFiveThousand.timingsMs.dashboard}ms. Add or widen cache windows before tenant growth increases request contention.`,
          priority: "warning",
        });
      }

      if ((atFiveThousand.timingsMs.assistant ?? 0) > 800) {
        recommendations.push({
          title: "Assistant lookup flows need optimization",
          detail: `Assistant benchmark time at ${atFiveThousand.size.toLocaleString()} rows is ${atFiveThousand.timingsMs.assistant}ms. Tighten candidate search and cache hot lookups before scaling usage quotas.`,
          priority: "warning",
        });
      }
    }
  }

  return recommendations;
}

async function getSystemHealthSnapshotBase() {
  const totalMemoryBytes = os.totalmem();
  const freeMemoryBytes = os.freemem();
  const usedMemoryBytes = totalMemoryBytes - freeMemoryBytes;
  const appMemory = process.memoryUsage();

  const [
    diskStats,
    diskIo,
    network,
    backup,
    nginx,
    appProbe,
    slowQueries,
    recentErrors,
    dbActivityRows,
    dbMemoryRows,
    dbSizeRows,
    tableSizeRows,
    localUploadBytes,
    tenantAnalytics,
    benchmarkReport,
    redisPing,
  ] = await Promise.all([
    fs.statfs(process.cwd()).catch(() => null),
    readLinuxDiskIoTotals(),
    readLinuxNetworkTotals(),
    readBackupHealth(),
    readNginxStatus(),
    probeApplicationResponseTime(),
    readRecentJsonLines<{ timestamp: string; durationMs?: number; query?: string }>(MONITORING_PATHS.slowQueryLog, 100),
    readRecentJsonLines<{ timestamp: string; source?: string; message?: string }>(MONITORING_PATHS.errorLog, 100),
    prisma.$queryRawUnsafe<
      Array<{
        total_client_connections: bigint;
        active_queries: bigint;
        idle_connections: bigint;
        idle_in_transaction: bigint;
        local_client_connections: bigint;
        max_connections: bigint;
      }>
    >(
      `SELECT
        COUNT(*) FILTER (WHERE backend_type = 'client backend')::bigint AS total_client_connections,
        COUNT(*) FILTER (WHERE backend_type = 'client backend' AND state = 'active' AND query NOT ILIKE '%pg_stat_activity%')::bigint AS active_queries,
        COUNT(*) FILTER (WHERE backend_type = 'client backend' AND state = 'idle')::bigint AS idle_connections,
        COUNT(*) FILTER (WHERE backend_type = 'client backend' AND state = 'idle in transaction')::bigint AS idle_in_transaction,
        COUNT(*) FILTER (WHERE backend_type = 'client backend' AND COALESCE(client_addr::text, 'local') IN ('127.0.0.1', '::1', 'local'))::bigint AS local_client_connections,
        current_setting('max_connections')::bigint AS max_connections
      FROM pg_stat_activity`
    ),
    prisma.$queryRawUnsafe<
      Array<{
        shared_buffers_bytes: bigint;
        effective_cache_size_bytes: bigint;
        work_mem_bytes: bigint;
        maintenance_work_mem_bytes: bigint;
        temp_buffers_bytes: bigint;
      }>
    >(
      `SELECT
        pg_size_bytes(current_setting('shared_buffers'))::bigint AS shared_buffers_bytes,
        pg_size_bytes(current_setting('effective_cache_size'))::bigint AS effective_cache_size_bytes,
        pg_size_bytes(current_setting('work_mem'))::bigint AS work_mem_bytes,
        pg_size_bytes(current_setting('maintenance_work_mem'))::bigint AS maintenance_work_mem_bytes,
        pg_size_bytes(current_setting('temp_buffers'))::bigint AS temp_buffers_bytes`
    ),
    prisma.$queryRawUnsafe<Array<{ size_bytes: bigint }>>(
      `SELECT pg_database_size(current_database())::bigint AS size_bytes`
    ),
    prisma.$queryRawUnsafe<Array<{ table_name: string; size_bytes: bigint }>>(
      `SELECT relname AS table_name, pg_total_relation_size(relid)::bigint AS size_bytes
       FROM pg_catalog.pg_statio_user_tables
       ORDER BY pg_total_relation_size(relid) DESC
       LIMIT 10`
    ),
    readDirectorySizeBytes(path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads")),
    getTopTenantUsageAnalytics(10),
    readLatestCapacityBenchmark(),
    redis.ping().catch(() => null),
  ]);

  const diskTotalBytes = diskStats ? Number(diskStats.blocks) * Number(diskStats.bsize) : null;
  const diskFreeBytes = diskStats ? Number(diskStats.bavail) * Number(diskStats.bsize) : null;
  const diskUsedBytes = diskTotalBytes !== null && diskFreeBytes !== null ? diskTotalBytes - diskFreeBytes : null;
  const diskUsedPercent = diskTotalBytes && diskUsedBytes !== null ? Math.round((diskUsedBytes / diskTotalBytes) * 100) : null;

  const dbActivity = dbActivityRows[0];
  const dbMemory = dbMemoryRows[0];
  const configuredAppPoolLimit = parseConfiguredPoolLimit();
  const totalClientConnections = dbActivity ? toBytes(dbActivity.total_client_connections) : 0;
  const activeQueries = dbActivity ? toBytes(dbActivity.active_queries) : 0;
  const idleConnections = dbActivity ? toBytes(dbActivity.idle_connections) : 0;
  const idleInTransaction = dbActivity ? toBytes(dbActivity.idle_in_transaction) : 0;
  const localClientConnections = dbActivity ? toBytes(dbActivity.local_client_connections) : 0;
  const maxConnections = dbActivity ? toBytes(dbActivity.max_connections) : 0;

  const alerts: HealthAlert[] = [];

  const cpuPercent = os.platform() === "linux"
    ? Math.round((os.loadavg()[0] / Math.max(os.cpus().length, 1)) * 100)
    : null;

  if (cpuPercent !== null && cpuPercent > MONITORING_THRESHOLDS.cpuPercent) {
    alerts.push({
      key: "cpu",
      severity: "critical",
      title: "CPU usage high",
      detail: `CPU load is ${cpuPercent}% which is above the ${MONITORING_THRESHOLDS.cpuPercent}% threshold.`,
    });
  }

  const osRamPercent = Math.round((usedMemoryBytes / totalMemoryBytes) * 100);
  if (osRamPercent > MONITORING_THRESHOLDS.ramPercent) {
    alerts.push({
      key: "ram",
      severity: "critical",
      title: "OS RAM usage high",
      detail: `Operating-system memory usage is ${osRamPercent}% which is above the ${MONITORING_THRESHOLDS.ramPercent}% threshold.`,
    });
  }

  if (diskUsedPercent !== null && diskUsedPercent > MONITORING_THRESHOLDS.diskPercent) {
    alerts.push({
      key: "disk",
      severity: "warning",
      title: "Disk usage high",
      detail: `Disk usage is ${diskUsedPercent}% which is above the ${MONITORING_THRESHOLDS.diskPercent}% threshold.`,
    });
  }

  if (maxConnections > 0 && totalClientConnections / maxConnections >= MONITORING_THRESHOLDS.dbConnectionsPercent / 100) {
    alerts.push({
      key: "db-connections",
      severity: "warning",
      title: "Database connection pressure",
      detail: `Client connections are ${totalClientConnections}/${maxConnections}.`,
    });
  }

  if (activeQueries > 0 && slowQueries.some((entry) => Number(entry.durationMs || 0) > MONITORING_THRESHOLDS.slowQueryMs)) {
    alerts.push({
      key: "slow-queries",
      severity: "warning",
      title: "Slow queries detected",
      detail: "Recent captured queries exceeded the configured slow-query threshold while active DB work was in progress.",
    });
  }

  if (appProbe.responseTimeMs > MONITORING_THRESHOLDS.responseTimeMs) {
    alerts.push({
      key: "app-response",
      severity: "warning",
      title: "App response time elevated",
      detail: `Synthetic response time is ${appProbe.responseTimeMs}ms which exceeds ${MONITORING_THRESHOLDS.responseTimeMs}ms.`,
    });
  }

  if (nginx.available && (nginx.fiveHundredsLastHour || 0) > MONITORING_THRESHOLDS.errorSpike5xxPerHour) {
    alerts.push({
      key: "nginx-5xx",
      severity: "critical",
      title: "5xx spike detected",
      detail: `Nginx recorded ${nginx.fiveHundredsLastHour} 5xx responses in the last hour.`,
    });
  }

  if (backup.stale || backup.status === "failed" || backup.status === "invalid") {
    alerts.push({
      key: "backup",
      severity: "critical",
      title: "Backup health needs attention",
      detail: backup.message,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    infrastructure: {
      cpu: {
        percent: cpuPercent,
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
        uptimeSeconds: Math.round(os.uptime()),
      },
      osMemory: {
        totalBytes: totalMemoryBytes,
        freeBytes: freeMemoryBytes,
        usedBytes: usedMemoryBytes,
        usedPercent: osRamPercent,
      },
      appMemory: {
        rssBytes: appMemory.rss,
        heapUsedBytes: appMemory.heapUsed,
        heapTotalBytes: appMemory.heapTotal,
        externalBytes: appMemory.external,
        arrayBuffersBytes: appMemory.arrayBuffers,
      },
      postgresMemory: {
        sharedBuffersBytes: dbMemory ? toBytes(dbMemory.shared_buffers_bytes) : null,
        effectiveCacheSizeBytes: dbMemory ? toBytes(dbMemory.effective_cache_size_bytes) : null,
        workMemBytes: dbMemory ? toBytes(dbMemory.work_mem_bytes) : null,
        maintenanceWorkMemBytes: dbMemory ? toBytes(dbMemory.maintenance_work_mem_bytes) : null,
        tempBuffersBytes: dbMemory ? toBytes(dbMemory.temp_buffers_bytes) : null,
        activeQueryWorkMemReservationBytes: dbMemory ? activeQueries * toBytes(dbMemory.work_mem_bytes) : null,
      },
      nginx: {
        available: nginx.available,
        requestsLastHour: nginx.requestsLastHour,
        fourHundredsLastHour: nginx.fourHundredsLastHour,
        fiveHundredsLastHour: nginx.fiveHundredsLastHour,
        averageRequestTimeMsLastHour: nginx.averageRequestTimeMsLastHour,
      },
      disk: {
        totalBytes: diskTotalBytes,
        freeBytes: diskFreeBytes,
        usedBytes: diskUsedBytes,
        usedPercent: diskUsedPercent,
        io: diskIo,
      },
      network,
      localUploadsBytes: localUploadBytes,
    },
    application: {
      probe: appProbe,
      recentErrors,
      redisStatus: redisPing === "PONG" ? "up" : "down",
    },
    database: {
      activity: {
        activeQueries,
        idleConnections,
        idleInTransaction,
        totalClientConnections,
      },
      connectionPool: {
        localClientConnections,
        configuredAppPoolLimit,
        maxConnections,
      },
      sizeBytes: dbSizeRows[0] ? toBytes(dbSizeRows[0].size_bytes) : null,
      slowQueries: slowQueries
        .filter((entry) => Number(entry.durationMs || 0) > MONITORING_THRESHOLDS.slowQueryMs)
        .map((entry) => ({
          timestamp: entry.timestamp,
          durationMs: entry.durationMs || null,
          queryPreview: typeof entry.query === "string" ? entry.query.slice(0, 220) : "",
        })),
      tableSizes: tableSizeRows.map((entry) => ({
        tableName: entry.table_name,
        sizeBytes: toBytes(entry.size_bytes),
      })),
    },
    backups: backup,
    tenants: {
      topOrganizations: tenantAnalytics,
      storageAttributionReady: false,
      storageNote: "Per-tenant storage is not currently attributable from the shared local/S3 upload model.",
    },
    benchmarks: {
      latest: benchmarkReport,
    },
    alerts,
  };
}

export async function getSystemHealthSnapshot() {
  const snapshot = await getSystemHealthSnapshotBase();
  return {
    ...snapshot,
    recommendations: buildCapacityRecommendations(snapshot),
  };
}
