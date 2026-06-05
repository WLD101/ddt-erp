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
  ]);

  const disabledAgents = totalAgents - activeAgents;
  const connectedAgents = totalAgents - missingAssistantAgents;
  const activeCalls = activeCallsData._sum.activeCalls || 0;

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
    </div>
  );
}
