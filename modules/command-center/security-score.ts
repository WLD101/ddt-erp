import { prisma } from "@/lib/prisma";

export type SecurityDomainScore = {
  domain: string;
  weight: number;
  score: number; // 0 to 100
  status: "PASS" | "PARTIAL" | "FAIL" | "NOT APPLICABLE";
  evidence: string;
};

export type SecurityMaturityReport = {
  overallScore: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  domains: SecurityDomainScore[];
  lastCalculated: Date;
};

export async function calculateSecurityMaturity(): Promise<SecurityMaturityReport> {
  // Authentication & Identity (15%)
  const totalUsers = await prisma.user.count({ where: { deletedAt: null } });
  const mfaUsers = await prisma.userSecurityProfile.count({ where: { totpEnabled: true } });
  const authScore = totalUsers > 0 ? (mfaUsers / totalUsers) * 100 : 100;
  
  // Monitoring & Audit Logging (5%)
  const recentAuditLogs = await prisma.securityEvent.count({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
  });
  const loggingScore = recentAuditLogs > 100 ? 100 : (recentAuditLogs > 0 ? 50 : 0);

  // Evidence-based static analysis (derived from Phase 2 Audit Reports)
  const domains: SecurityDomainScore[] = [
    {
      domain: "Authentication & Identity",
      weight: 15,
      score: authScore,
      status: authScore >= 90 ? "PASS" : "PARTIAL",
      evidence: `${mfaUsers} of ${totalUsers} active users have MFA enabled. System enforces strict rate limiting.`,
    },
    {
      domain: "Authorization & RBAC",
      weight: 15,
      score: 100,
      status: "PASS",
      evidence: "Strict Role-Based Access Control enforced at the middleware layer (lib/tenant.ts).",
    },
    {
      domain: "Multi-Tenant Isolation",
      weight: 15,
      score: 100,
      status: "PASS",
      evidence: "All endpoints resolve context via getCurrentTenantContext(). Prisma schema mandates organizationId.",
    },
    {
      domain: "API Security",
      weight: 10,
      score: 80,
      status: "PARTIAL",
      evidence: "Authorization strictly enforced. Global rate limiting is active, but granular endpoint limits need refinement.",
    },
    {
      domain: "Voice/Vapi Security",
      weight: 10,
      score: 100,
      status: "PASS",
      evidence: "Webhooks enforce x-vapi-signature, payload bounding (2MB limit), and CIDR blocks.",
    },
    {
      domain: "Infrastructure & Secrets",
      weight: 8,
      score: 100,
      status: "PASS",
      evidence: "Secrets loaded via secure env variables. Production containers run with dropped capabilities and read-only root fs.",
    },
    {
      domain: "Disaster Recovery & Backups",
      weight: 8,
      score: 100,
      status: "PASS",
      evidence: "Daily automated pg_dump with Cloudflare R2 sync. Live restore tested automatically (scripts/backup-db.sh).",
    },
    {
      domain: "High Availability",
      weight: 7,
      score: 100,
      status: "PASS",
      evidence: "Redis and Postgres mapped to loopback interface. Worker container auto-restarts via Docker.",
    },
    {
      domain: "Monitoring & Audit Logging",
      weight: 5,
      score: loggingScore,
      status: loggingScore === 100 ? "PASS" : (loggingScore > 0 ? "PARTIAL" : "FAIL"),
      evidence: `${recentAuditLogs} security events logged in the last 30 days.`,
    },
    {
      domain: "Dependency Security",
      weight: 4,
      score: 100,
      status: "PASS",
      evidence: "NPM audit resolved (Phase 1 completion).",
    },
    {
      domain: "Compliance Readiness",
      weight: 3,
      score: 90,
      status: "PASS",
      evidence: "High readiness for ISO 27001 and SOC 2 Type II.",
    },
  ];

  let totalWeightedScore = 0;
  for (const domain of domains) {
    totalWeightedScore += (domain.score / 100) * domain.weight;
  }

  let grade: SecurityMaturityReport["grade"] = "F";
  if (totalWeightedScore >= 95) grade = "A+";
  else if (totalWeightedScore >= 90) grade = "A";
  else if (totalWeightedScore >= 80) grade = "B";
  else if (totalWeightedScore >= 70) grade = "C";
  else if (totalWeightedScore >= 60) grade = "D";

  return {
    overallScore: Math.round(totalWeightedScore),
    grade,
    domains,
    lastCalculated: new Date(),
  };
}
