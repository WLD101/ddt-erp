import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-on-surface">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-white">Voice Command Center</h1>
          <p className="text-sm text-slate-400 font-medium">
            Super Admin view of all Voice SaaS operations, AI agents, and telephony connections.
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest ${
          capacityStatus === "Healthy" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
          capacityStatus === "Monitor" ? "bg-amber-500/20 border-amber-500/30 text-amber-400" :
          "bg-red-500/20 border-red-500/30 text-red-400"
        }`}>
          Status: {capacityStatus}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-white/10 pb-4">
        <Link href="/voice/admin/tenants" className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400 hover:underline bg-cyan-500/10 px-4 py-2 rounded-xl">
          Tenants
        </Link>
        <Link href="/voice/admin/agents" className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400 hover:underline border border-cyan-500/30 px-4 py-2 rounded-xl">
          Agents
        </Link>
        <Link href="/wq-command-center/system-health" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 hover:underline border border-white/10 px-4 py-2 rounded-xl">
          System Health
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Live Tenants</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-cyan-400">{totalTenants}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Active AI Agents</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-white">{activeAgents}</p>
          <p className="text-xs text-slate-400 mt-1">{disabledAgents} disabled</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Active Calls Now</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-white">{activeCalls}</p>
          <p className="text-xs text-amber-400 mt-1">{capacityFullEvents} capacity drops today</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Calls Today</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-white">{callsToday}</p>
          <p className="text-xs text-slate-400 mt-1">{callsThisMonth} this month</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Total Leads</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-emerald-400">{totalLeads}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Vapi Cost Today</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-white">${totalCostToday.toFixed(2)}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Vapi Cost This Month</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-white">${totalCostThisMonth.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-3">Async Processing</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between"><span>Queued Jobs</span><span className="font-bold">{queuedJobs}</span></div>
            <div className="flex justify-between text-red-400"><span>Failed Jobs</span><span className="font-bold">{failedJobs}</span></div>
            <div className="flex justify-between"><span>Failed Webhooks</span><span className="font-bold text-red-400">{failedWebhooks}</span></div>
            <div className="flex justify-between text-amber-400"><span>Mapping Failures</span><span className="font-bold">{mappingFailures}</span></div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-3">Telephony Health</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between"><span>Vapi Connected Agents</span><span className="font-bold">{connectedAgents}</span></div>
            <div className="flex justify-between text-red-400"><span>Missing Assistant IDs</span><span className="font-bold">{missingAssistantAgents}</span></div>
            <div className="flex justify-between text-red-400"><span>Missing Phone IDs</span><span className="font-bold">{missingPhoneAgents}</span></div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-3">Notifications Queue</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between"><span>WhatsApp Queued</span><span className="font-bold">{whatsappQueued}</span></div>
            <div className="flex justify-between text-red-400"><span>WhatsApp Failed</span><span className="font-bold">{whatsappFailed}</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Top Tenants By Call Volume (This Month)</h2>
        {topTenantsByCalls.length === 0 ? (
          <p className="text-sm text-slate-400">No usage data found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topTenantsByCalls.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-white/10 bg-slate-950/40 flex justify-between items-center text-slate-200">
                <div>
                  <p className="text-sm font-bold text-white">{t.organization.name}</p>
                  <p className="text-xs text-cyan-400">Limit: {t.callsThisMonth} / ~</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-white">{t.callsThisMonth}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Calls</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-black text-white">Top 10 Highest-Cost Tenants</h2>
            <span className="text-xs text-slate-400">Monthly cost by business</span>
          </div>
          <div className="mt-4 space-y-3">
            {costByBusinessRows.length === 0 ? (
              <p className="text-sm text-slate-400">No cost data available yet.</p>
            ) : (
              costByBusinessRows.map((row) => (
                <div key={row.organizationId} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
                  <div>
                    <div className="font-bold text-white">{organizationMap.get(row.organizationId) || row.organizationId}</div>
                    <div className="text-xs text-slate-400">
                      {Math.round((row._sum.durationSeconds || 0) / 60)} min • {row._count._all} calls
                    </div>
                  </div>
                  <div className="font-black text-cyan-300">${(row._sum.costUsd || 0).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-black text-white">Cost by VoiceAgent</h2>
            <span className="text-xs text-slate-400">Monthly</span>
          </div>
          <div className="mt-4 space-y-3">
            {costByAgentRows.length === 0 ? (
              <p className="text-sm text-slate-400">No agent-linked cost data available yet.</p>
            ) : (
              costByAgentRows.map((row) => {
                const agent = row.voiceAgentId ? agentMap.get(row.voiceAgentId) : null;
                return (
                  <div key={row.voiceAgentId || "unmapped"} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white">{agent?.displayName || agent?.name || row.voiceAgentId || "Unmapped agent"}</div>
                      <div className="font-black text-cyan-300">${(row._sum.costUsd || 0).toFixed(2)}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {agent?.internalName || "No internal key"} • {Math.round((row._sum.durationSeconds || 0) / 60)} min • {row._count._all} calls
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-black text-white">Cost by Phone Number</h2>
            <span className="text-xs text-slate-400">Monthly</span>
          </div>
          <div className="mt-4 space-y-3">
            {costByPhoneRows.length === 0 ? (
              <p className="text-sm text-slate-400">No phone-number cost data available yet.</p>
            ) : (
              costByPhoneRows.map((row) => {
                const linkedAgent = agents.find((agent) => agent.vapiPhoneNumberId === row.providerPhoneNumberId);
                return (
                  <div key={row.providerPhoneNumberId || "unknown-phone"} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white">
                        {linkedAgent?.vapiPhoneNumberName || row.providerPhoneNumberId || "Unlabelled phone"}
                      </div>
                      <div className="font-black text-cyan-300">${(row._sum.costUsd || 0).toFixed(2)}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {Math.round((row._sum.durationSeconds || 0) / 60)} min • {row._count._all} calls
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-black text-white">Cost Tracking Exceptions</h2>
            <span className="text-xs text-slate-400">Monthly</span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
              <span>Calls without cost data</span>
              <span className="font-black text-amber-300">{callsWithoutCostData}</span>
            </div>
            <div className="flex justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
              <span>Calls without mapped tenant or agent</span>
              <span className="font-black text-rose-300">{callsWithoutMappedTenantOrAgent}</span>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-xs leading-6 text-slate-400">
              Internal Vapi tracking names stay separate from the caller-facing business name. Admin cost views can use the
              tracking names without exposing another tenant&apos;s billing data in tenant dashboards.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
