import path from "path";

function resolveLogPath(envKey: string, fallbackName: string) {
  return process.env[envKey] || path.join(process.cwd(), "runtime-logs", fallbackName);
}

export const MONITORING_PATHS = {
  slowQueryLog: resolveLogPath("MONITORING_SLOW_QUERY_LOG_PATH", "slow-queries.jsonl"),
  errorLog: resolveLogPath("MONITORING_ERROR_LOG_PATH", "app-errors.jsonl"),
  benchmarkResults: resolveLogPath("MONITORING_BENCHMARK_RESULTS_PATH", "capacity-benchmarks.json"),
  backupHealth: process.env.MONITORING_BACKUP_HEALTH_PATH || path.join(process.cwd(), "runtime-logs", "backup-health.json"),
  nginxAccessLog:
    process.env.MONITORING_NGINX_ACCESS_LOG_PATH ||
    "/var/log/nginx/whatsquery.access.log",
  nginxErrorLog:
    process.env.MONITORING_NGINX_ERROR_LOG_PATH ||
    "/var/log/nginx/whatsquery.error.log",
};

export const MONITORING_THRESHOLDS = {
  cpuPercent: 80,
  ramPercent: 85,
  diskPercent: 75,
  dbConnectionsPercent: 80,
  slowQueryMs: 1000,
  responseTimeMs: 2000,
  backupMaxAgeHours: 36,
  errorSpike5xxPerHour: 10,
};

export function getMonitoringProbeUrl() {
  if (process.env.MONITORING_APP_PROBE_URL) {
    return process.env.MONITORING_APP_PROBE_URL;
  }

  if (process.env.NODE_ENV === "production") {
    return `http://127.0.0.1:${process.env.PORT || "3000"}/auth/signin`;
  }

  return `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/signin`;
}
