import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const shellCardClassName = "overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.08)]";

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  tone,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  tone: "primary" | "secondary" | "error" | "default";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    error: "bg-error/10 text-error",
    default: "bg-outline-variant/20 text-on-surface-variant"
  };
  return (
    <Card className={`${shellCardClassName} transition-transform duration-300 hover:-translate-y-1`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-outline-variant/10">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">{label}</CardTitle>
        <div className={`rounded-2xl p-2 ${toneMap[tone]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-6 pt-6">
        <div className="text-4xl font-black tracking-tight text-on-surface">{value}</div>
        {subtitle && <p className="mt-2 text-xs font-medium text-on-surface-variant">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default async function VoiceAdminCommandCenterPage() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalTenants,
    totalAgents,
    activeAgents,
    missingAssistantAgents,
    missingPhoneAgents,
    callsToday,
    callsThisMonth,
    failedCalls,
    missedCalls,
    totalLeads,
    voicePackagesCount,
    failedWebhooks,
    mappingFailures,
    queuedJobs,
    failedJobs,
    whatsappQueued,
    whatsappFailed,
    activeCallsData,
    capacityFullEvents,
    topTenantsByCalls,
    totalCostTodayAgg,
    totalCostThisMonthAgg,
    callsWithoutCostData,
    callsWithoutMappedTenantOrAgent,
    costByBusinessRows,
    costByAgentRows,
    costByPhoneRows,
  ] = await Promise.all([
    prisma.voiceBusinessProfile.count(),
    prisma.voiceAgent.count(),
    prisma.voiceAgent.count({ where: { isActive: true } }),
    prisma.voiceAgent.count({ where: { vapiAssistantId: null } }),
    prisma.voiceAgent.count({ where: { vapiPhoneNumberId: null } }),
    prisma.voiceCallLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.voiceCallLog.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.voiceCallLog.count({ where: { callStatus: { in: ["FAILED", "ERROR"] } } }),
    prisma.voiceCallLog.count({ where: { isMissed: true } }),
    prisma.voiceLead.count(),
    prisma.package.count({ where: { productType: "VOICE" } }),
    prisma.voiceWebhookEvent.count({ where: { status: "failed" } }),
    prisma.voiceWebhookEvent.count({ where: { status: "mapping_failed" } }),
    prisma.voiceJob.count({ where: { status: "queued" } }),
    prisma.voiceJob.count({ where: { status: "failed" } }),
    prisma.voiceNotificationLog.count({ where: { type: "whatsapp", status: "queued" } }),
    prisma.voiceNotificationLog.count({ where: { type: "whatsapp", status: "failed" } }),
    prisma.voiceUsageMeter.aggregate({ _sum: { activeCalls: true } }),
    prisma.voiceWebhookEvent.count({ where: { errorMessage: { contains: "CAPACITY_FULL" } } }),
    prisma.voiceUsageMeter.findMany({
      orderBy: { callsThisMonth: "desc" },
      take: 5,
      include: { organization: { select: { name: true } } },
    }),
    prisma.voiceCallLog.aggregate({
      _sum: { costUsd: true },
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.voiceCallLog.aggregate({
      _sum: { costUsd: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.voiceCallLog.count({
      where: {
        createdAt: { gte: startOfMonth },
        OR: [{ costUsd: null }, { costUsd: 0 }],
      },
    }),
    prisma.voiceCallLog.count({
      where: {
        createdAt: { gte: startOfMonth },
        OR: [{ voiceBusinessProfileId: null }, { voiceAgentId: null }],
      },
    }),
    prisma.voiceCallLog.groupBy({
      by: ["organizationId"],
      where: { createdAt: { gte: startOfMonth } },
      _sum: { costUsd: true, durationSeconds: true },
      _count: { _all: true },
      orderBy: { _sum: { costUsd: "desc" } },
      take: 10,
    }),
    prisma.voiceCallLog.groupBy({
      by: ["voiceAgentId"],
      where: { createdAt: { gte: startOfMonth }, voiceAgentId: { not: null } },
      _sum: { costUsd: true, durationSeconds: true },
      _count: { _all: true },
      orderBy: { _sum: { costUsd: "desc" } },
      take: 10,
    }),
    prisma.voiceCallLog.groupBy({
      by: ["providerPhoneNumberId"],
      where: { createdAt: { gte: startOfMonth }, providerPhoneNumberId: { not: null } },
      _sum: { costUsd: true, durationSeconds: true },
      _count: { _all: true },
      orderBy: { _sum: { costUsd: "desc" } },
      take: 10,
    }),
  ]);

  const disabledAgents = totalAgents - activeAgents;
  const connectedAgents = totalAgents - missingAssistantAgents;
  const activeCalls = activeCallsData._sum.activeCalls || 0;
  const totalCostToday = totalCostTodayAgg._sum.costUsd || 0;
  const totalCostThisMonth = totalCostThisMonthAgg._sum.costUsd || 0;

  const [organizations, agents] = await Promise.all([
    prisma.organization.findMany({
      where: { id: { in: [...new Set(costByBusinessRows.map((row) => row.organizationId))] } },
      select: { id: true, name: true },
    }),
    prisma.voiceAgent.findMany({
      where: { id: { in: [...new Set(costByAgentRows.map((row) => row.voiceAgentId).filter(Boolean) as string[])] } },
      select: {
        id: true,
        name: true,
        displayName: true,
        internalName: true,
        vapiPhoneNumberId: true,
        vapiPhoneNumberName: true,
        organization: { select: { name: true } },
      },
    }),
  ]);

  const organizationMap = new Map(organizations.map((org) => [org.id, org.name]));
  const agentMap = new Map(agents.map((agent) => [agent.id, agent]));

  let capacityStatus = "Healthy";
  if (failedWebhooks > 50 || failedJobs > 50 || mappingFailures > 20 || capacityFullEvents > 10) capacityStatus = "Monitor";
  if (failedWebhooks > 200 || failedJobs > 200 || capacityFullEvents > 50) capacityStatus = "Urgent";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface pb-12">
      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        
        <section className="overflow-hidden rounded-[32px] border border-outline-variant/30 bg-linear-to-br from-surface via-surface to-surface-container-low shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-8 px-8 py-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20">
                Command Center
              </Badge>
              <div className="space-y-3">
                <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
                  <span className="material-symbols-outlined text-[34px] text-primary sm:text-[40px]">graphic_eq</span>
                  Voice Platform
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">
                  Platform Owner view of all Voice SaaS operations, AI agents, telephony costs, and tenant billing.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">System Status</p>
                <p className={`mt-3 text-2xl font-black tracking-tight ${capacityStatus === "Healthy" ? "text-emerald-500" : "text-amber-500"}`}>{capacityStatus}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Active monitoring active</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Live Tenants</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{totalTenants}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Voice workspaces</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">AI Agents</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{activeAgents}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Configured in prod</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/20 px-8 py-4">
            <Link href="/voice/admin/tenants" className="text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:underline bg-primary/10 px-4 py-2 rounded-xl">
              Manage Tenants
            </Link>
            <Link href="/voice/admin/packages" className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:underline border border-outline-variant/40 px-4 py-2 rounded-xl">
              Packages
            </Link>
            <Link href="/voice/admin/agents" className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:underline border border-outline-variant/40 px-4 py-2 rounded-xl">
              All Agents
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon="call" label="Active Calls Now" value={activeCalls} tone="primary" subtitle={`${capacityFullEvents} capacity drops`} />
          <MetricCard icon="today" label="Calls Today" value={callsToday} tone="default" subtitle={`${callsThisMonth} this month`} />
          <MetricCard icon="contact_mail" label="Total Leads Captured" value={totalLeads} tone="secondary" subtitle="Since inception" />
          <MetricCard icon="payments" label="Vapi Cost Today" value={`$${totalCostToday.toFixed(2)}`} tone="default" subtitle={`$${totalCostThisMonth.toFixed(2)} this month`} />
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-xs font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">sync_problem</span>
                Async Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-3 text-sm text-on-surface">
              <div className="flex justify-between"><span>Queued Jobs</span><span className="font-bold">{queuedJobs}</span></div>
              <div className="flex justify-between text-error"><span>Failed Jobs</span><span className="font-bold">{failedJobs}</span></div>
              <div className="flex justify-between"><span>Failed Webhooks</span><span className="font-bold text-error">{failedWebhooks}</span></div>
              <div className="flex justify-between text-amber-500"><span>Mapping Failures</span><span className="font-bold">{mappingFailures}</span></div>
            </CardContent>
          </Card>

          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-xs font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">phonelink_ring</span>
                Telephony Health
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-3 text-sm text-on-surface">
              <div className="flex justify-between"><span>Vapi Connected Agents</span><span className="font-bold">{connectedAgents}</span></div>
              <div className="flex justify-between text-error"><span>Missing Assistant IDs</span><span className="font-bold">{missingAssistantAgents}</span></div>
              <div className="flex justify-between text-error"><span>Missing Phone IDs</span><span className="font-bold">{missingPhoneAgents}</span></div>
            </CardContent>
          </Card>

          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-xs font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">warning</span>
                Tracking Exceptions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-3 text-sm text-on-surface">
              <div className="flex justify-between text-amber-500"><span>Calls without cost</span><span className="font-bold">{callsWithoutCostData}</span></div>
              <div className="flex justify-between text-error"><span>Calls unmapped</span><span className="font-bold">{callsWithoutMappedTenantOrAgent}</span></div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">store</span>
                Top 10 Highest-Cost Tenants
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-4 space-y-3">
              {costByBusinessRows.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No cost data available yet.</p>
              ) : (
                costByBusinessRows.map((row) => (
                  <div key={row.organizationId} className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm">
                    <div>
                      <div className="font-bold text-on-surface">{organizationMap.get(row.organizationId) || row.organizationId}</div>
                      <div className="text-xs text-on-surface-variant">
                        {Math.round((row._sum.durationSeconds || 0) / 60)} min • {row._count._all} calls
                      </div>
                    </div>
                    <div className="font-black text-primary">${(row._sum.costUsd || 0).toFixed(2)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">smart_toy</span>
                Cost by VoiceAgent
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-4 space-y-3">
              {costByAgentRows.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No agent-linked cost data available yet.</p>
              ) : (
                costByAgentRows.map((row) => {
                  const agent = row.voiceAgentId ? agentMap.get(row.voiceAgentId) : null;
                  return (
                    <div key={row.voiceAgentId || "unmapped"} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-on-surface">{agent?.displayName || agent?.name || row.voiceAgentId || "Unmapped agent"}</div>
                        <div className="font-black text-primary">${(row._sum.costUsd || 0).toFixed(2)}</div>
                      </div>
                      <div className="mt-1 text-xs text-on-surface-variant">
                        {agent?.internalName || "No internal key"} • {Math.round((row._sum.durationSeconds || 0) / 60)} min • {row._count._all} calls
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

