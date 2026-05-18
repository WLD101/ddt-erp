import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

type MonitoringRuntime = {
  bootstrapMonitoringHooks: () => void;
  MONITORING_PATHS: { slowQueryLog: string };
  MONITORING_THRESHOLDS: { slowQueryMs: number };
  appendJsonLine: (filePath: string, payload: unknown) => Promise<void>;
};

function loadMonitoringRuntime(): MonitoringRuntime | null {
  if (typeof window !== "undefined") {
    return null;
  }

  try {
    const req = eval("require") as NodeRequire;
    return {
      ...req("@/lib/monitoring/bootstrap"),
      ...req("@/lib/monitoring/config"),
      ...req("@/lib/monitoring/logging"),
    } as MonitoringRuntime;
  } catch {
    return null;
  }
}

function createPrismaClient() {
  const monitoring = loadMonitoringRuntime();
  const client = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "warn" },
      { emit: "stdout", level: "error" },
    ],
  });

  const monitoredClient = client as PrismaClient & { __monitoringHooked?: boolean };
  if (!monitoredClient.__monitoringHooked && monitoring) {
    monitoredClient.__monitoringHooked = true;
    client.$on("query", (event: Prisma.QueryEvent) => {
      if (event.duration <= monitoring.MONITORING_THRESHOLDS.slowQueryMs) {
        return;
      }

      void monitoring.appendJsonLine(monitoring.MONITORING_PATHS.slowQueryLog, {
        timestamp: new Date().toISOString(),
        durationMs: event.duration,
        target: event.target,
        query: event.query,
        params: event.params,
      }).catch((error) => {
        console.error("[monitoring:slow-query] failed to write slow query event", error);
      });
    });
  }

  return client;
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

loadMonitoringRuntime()?.bootstrapMonitoringHooks();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
