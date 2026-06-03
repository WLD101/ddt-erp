import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";

const execAsync = promisify(exec);

export type SystemHealthMetrics = {
  server: {
    hostname: string;
    uptimeSeconds: number;
    loadAverage: number[];
    totalRamMb: number;
    freeRamMb: number;
    usedRamMb: number;
    ramUsagePercent: number;
    diskTotalGb: number;
    diskUsedGb: number;
    diskFreeGb: number;
    diskUsagePercent: number;
  };
  services: {
    whatsqueryStatus: string;
    nginxStatus: string;
    postgresqlStatus: string;
    sslExpiryVoice: string;
    sslExpiryErp: string;
  };
  database: {
    totalSizeBytes: number;
    activeConnections: number;
    topTables: Array<{ tableName: string; sizeBytes: number }>;
  };
  productUsage: {
    totalOrganizations: number;
    erpTenantCount: number;
    voiceBusinessCount: number;
    userCount: number;
    erp: {
      customers: number;
      products: number;
      invoices: number;
    };
    voice: {
      agents: number;
      calls: number;
      leads: number;
    };
  };
};

async function safeExec(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd);
    return stdout.trim();
  } catch (error) {
    return `Error or inactive: ${error}`;
  }
}

async function getDiskUsage() {
  try {
    // df -k output on linux
    const { stdout } = await execAsync("df -k /");
    const lines = stdout.trim().split("\n");
    if (lines.length > 1) {
      const parts = lines[1].trim().split(/\s+/);
      // Size Used Avail Use%
      const totalKb = parseInt(parts[1], 10);
      const usedKb = parseInt(parts[2], 10);
      const availKb = parseInt(parts[3], 10);
      
      const diskTotalGb = totalKb / (1024 * 1024);
      const diskUsedGb = usedKb / (1024 * 1024);
      const diskFreeGb = availKb / (1024 * 1024);
      const diskUsagePercent = (usedKb / totalKb) * 100;
      
      return { diskTotalGb, diskUsedGb, diskFreeGb, diskUsagePercent };
    }
  } catch (e) {
    // fallback for windows dev
  }
  return { diskTotalGb: 0, diskUsedGb: 0, diskFreeGb: 0, diskUsagePercent: 0 };
}

async function getDatabaseMetrics() {
  try {
    const sizeResult: any = await prisma.$queryRaw`SELECT pg_database_size(current_database()) as size;`;
    const totalSizeBytes = Number(sizeResult[0]?.size || 0);

    const connResult: any = await prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity;`;
    const activeConnections = Number(connResult[0]?.count || 0);

    const tablesResult: any = await prisma.$queryRaw`
      SELECT relname as table_name, pg_total_relation_size(relid) as total_size 
      FROM pg_catalog.pg_statio_user_tables 
      ORDER BY pg_total_relation_size(relid) DESC LIMIT 10;
    `;
    const topTables = tablesResult.map((row: any) => ({
      tableName: row.table_name,
      sizeBytes: Number(row.total_size || 0),
    }));

    return { totalSizeBytes, activeConnections, topTables };
  } catch (e) {
    return { totalSizeBytes: 0, activeConnections: 0, topTables: [] };
  }
}

export async function getCollectiveSystemHealth(): Promise<SystemHealthMetrics> {
  const totalRamMb = os.totalmem() / (1024 * 1024);
  const freeRamMb = os.freemem() / (1024 * 1024);
  const usedRamMb = totalRamMb - freeRamMb;
  const ramUsagePercent = (usedRamMb / totalRamMb) * 100;

  const diskMetrics = await getDiskUsage();
  const dbMetrics = await getDatabaseMetrics();

  // Basic service checks (will return error string if not running or command fails)
  const whatsqueryStatus = process.env.NODE_ENV === "production" ? await safeExec("systemctl is-active whatsquery") : "Development (Active)";
  const nginxStatus = process.env.NODE_ENV === "production" ? await safeExec("systemctl is-active nginx") : "Development (Active)";
  const postgresqlStatus = process.env.NODE_ENV === "production" ? await safeExec("systemctl is-active postgresql") : "Development (Active)";

  const [
    totalOrganizations,
    voiceBusinessCount,
    userCount,
    erpCustomers,
    erpProducts,
    erpInvoices,
    voiceAgents,
    voiceCalls,
    voiceLeads,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.voiceBusinessProfile.count(),
    prisma.user.count(),
    prisma.customer.count(),
    prisma.product.count(),
    prisma.salesInvoice.count(),
    prisma.voiceAgent.count(),
    prisma.voiceCallLog.count(),
    prisma.voiceLead.count(),
  ]);

  return {
    server: {
      hostname: os.hostname(),
      uptimeSeconds: os.uptime(),
      loadAverage: os.loadavg(),
      totalRamMb,
      freeRamMb,
      usedRamMb,
      ramUsagePercent,
      ...diskMetrics,
    },
    services: {
      whatsqueryStatus,
      nginxStatus,
      postgresqlStatus,
      sslExpiryVoice: "Manual Check Required", // Placeholder for actual certbot logic if needed
      sslExpiryErp: "Manual Check Required",
    },
    database: dbMetrics,
    productUsage: {
      totalOrganizations,
      erpTenantCount: totalOrganizations - voiceBusinessCount, // Approximation
      voiceBusinessCount,
      userCount,
      erp: {
        customers: erpCustomers,
        products: erpProducts,
        invoices: erpInvoices,
      },
      voice: {
        agents: voiceAgents,
        calls: voiceCalls,
        leads: voiceLeads,
      },
    },
  };
}
