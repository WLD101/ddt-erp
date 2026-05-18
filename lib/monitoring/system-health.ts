import fs from "fs/promises";
import os from "os";
import { performance } from "perf_hooks";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

import { MONITORING_PATHS, MONITORING_THRESHOLDS, getMonitoringProbeUrl } from "./config";
import { readRecentJsonLines } from "./logging";

type AlertSeverity = "info" | "warning" | "critical";

type HealthAlert = {
  key: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
};

async function readOptionalText(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
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
      fourHundredsLastHour: null as number | null,
      fiveHundredsLastHour: null as number | null,
      averageRequestTimeMsLastHour: null as number | null,
    };
  }

  const since = Date.now() - 60 * 60 * 1000;
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
    };
  } catch {
    return {
      responseTimeMs: Math.round(performance.now() - started),
      statusCode: null as number | null,
      ok: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function toGb(bytes: number) {
  return Number((bytes / 1024 / 1024 / 1024).toFixed(2));
}

export async function getSystemHealthSnapshot() {
  const cpuPercent = os.platform() === "linux"
    ? Math.round((os.loadavg()[0] / Math.max(os.cpus().length, 1)) * 100)
    : null;
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const ramPercent = Math.round(((totalMemory - freeMemory) / totalMemory) * 100);

  const [diskStats, diskIo, network, backup, nginx, appProbe, slowQueries, recentErrors, dbStats, dbSize, tableSizes, tenantFootprint, redisPing] =
    await Promise.all([
      fs.statfs(process.cwd()).catch(() => null),
      readLinuxDiskIoTotals(),
      readLinuxNetworkTotals(),
      readBackupHealth(),
      readNginxStatus(),
      probeApplicationResponseTime(),
      readRecentJsonLines<{ timestamp: string; durationMs?: number; query?: string }>(MONITORING_PATHS.slowQueryLog, 100),
      readRecentJsonLines<{ timestamp: string; source?: string; message?: string }>(MONITORING_PATHS.errorLog, 100),
      prisma.$queryRawUnsafe<Array<{ current_connections: bigint; max_connections: bigint }>>(
        `SELECT COUNT(*)::bigint AS current_connections, current_setting('max_connections')::bigint AS max_connections FROM pg_stat_activity`
      ),
      prisma.$queryRawUnsafe<Array<{ size_bytes: bigint }>>(
        `SELECT pg_database_size(current_database())::bigint AS size_bytes`
      ),
      prisma.$queryRawUnsafe<Array<{ table_name: string; size_bytes: bigint }>>(
        `SELECT relname AS table_name, pg_total_relation_size(relid)::bigint AS size_bytes FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 8`
      ),
      prisma.organization.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              members: true,
              branches: true,
              customers: true,
              suppliers: true,
              products: true,
              salesInvoices: true,
              purchaseInvoices: true,
              exportRequests: true,
            },
          },
        },
      }),
      redis.ping().catch(() => null),
    ]);

  const diskTotal = diskStats ? Number(diskStats.blocks) * Number(diskStats.bsize) : null;
  const diskFree = diskStats ? Number(diskStats.bavail) * Number(diskStats.bsize) : null;
  const diskUsed = diskTotal !== null && diskFree !== null ? diskTotal - diskFree : null;
  const diskPercent = diskTotal && diskUsed !== null ? Math.round((diskUsed / diskTotal) * 100) : null;

  const currentConnections = dbStats[0] ? Number(dbStats[0].current_connections) : 0;
  const maxConnections = dbStats[0] ? Number(dbStats[0].max_connections) : 0;
  const dbConnectionPercent = maxConnections > 0 ? Math.round((currentConnections / maxConnections) * 100) : null;

  const alerts: HealthAlert[] = [];

  if (cpuPercent !== null && cpuPercent > MONITORING_THRESHOLDS.cpuPercent) {
    alerts.push({
      key: "cpu",
      severity: "critical",
      title: "CPU usage high",
      detail: `CPU load is ${cpuPercent}% which is above the ${MONITORING_THRESHOLDS.cpuPercent}% threshold.`,
    });
  }

  if (ramPercent > MONITORING_THRESHOLDS.ramPercent) {
    alerts.push({
      key: "ram",
      severity: "critical",
      title: "RAM usage high",
      detail: `Memory usage is ${ramPercent}% which is above the ${MONITORING_THRESHOLDS.ramPercent}% threshold.`,
    });
  }

  if (diskPercent !== null && diskPercent > MONITORING_THRESHOLDS.diskPercent) {
    alerts.push({
      key: "disk",
      severity: "warning",
      title: "Disk usage high",
      detail: `Disk usage is ${diskPercent}% which is above the ${MONITORING_THRESHOLDS.diskPercent}% threshold.`,
    });
  }

  if (dbConnectionPercent !== null && dbConnectionPercent > MONITORING_THRESHOLDS.dbConnectionsPercent) {
    alerts.push({
      key: "db-connections",
      severity: "warning",
      title: "Database connection pressure",
      detail: `Connections are at ${dbConnectionPercent}% of max (${currentConnections}/${maxConnections}).`,
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

  const slowQueryOverThreshold = slowQueries.filter((entry) => Number(entry.durationMs || 0) > MONITORING_THRESHOLDS.slowQueryMs);
  if (slowQueryOverThreshold.length > 0) {
    alerts.push({
      key: "slow-queries",
      severity: "warning",
      title: "Slow queries detected",
      detail: `${slowQueryOverThreshold.length} recent queries exceeded ${MONITORING_THRESHOLDS.slowQueryMs}ms.`,
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
      cpuPercent,
      ramPercent,
      uptimeSeconds: Math.round(os.uptime()),
      totalMemoryGb: toGb(totalMemory),
      freeMemoryGb: toGb(freeMemory),
      diskPercent,
      diskUsedGb: diskUsed !== null ? toGb(diskUsed) : null,
      diskTotalGb: diskTotal !== null ? toGb(diskTotal) : null,
      diskIo,
      network,
    },
    application: {
      responseTimeMs: appProbe.responseTimeMs,
      responseStatusCode: appProbe.statusCode,
      responseOk: appProbe.ok,
      nginx,
      recentErrors,
      redisStatus: redisPing === "PONG" ? "up" : "down",
    },
    database: {
      currentConnections,
      maxConnections,
      dbConnectionPercent,
      databaseSizeGb: dbSize[0] ? toGb(Number(dbSize[0].size_bytes)) : null,
      tableSizes: tableSizes.map((table) => ({
        tableName: table.table_name,
        sizeGb: toGb(Number(table.size_bytes)),
      })),
      slowQueries: slowQueryOverThreshold.map((entry) => ({
        timestamp: entry.timestamp,
        durationMs: entry.durationMs || null,
        queryPreview: typeof entry.query === "string" ? entry.query.slice(0, 180) : "",
      })),
    },
    backups: backup,
    tenants: tenantFootprint.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      counts: tenant._count,
    })),
    alerts,
  };
}
