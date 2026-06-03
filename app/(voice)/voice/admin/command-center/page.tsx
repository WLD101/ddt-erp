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
    webhookAudits,
    voicePackagesCount,
    recentErrors,
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
    prisma.voiceActionAuditLog.findMany({
      where: { action: { contains: "webhook" } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.package.count({ where: { productType: "VOICE" } }),
    prisma.voiceActionAuditLog.findMany({
      where: { status: { not: "SUCCESS" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { organization: { select: { name: true } } },
    }),
  ]);

  const disabledAgents = totalAgents - activeAgents;
  const connectedAgents = totalAgents - missingAssistantAgents; // Approximation

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-on-surface">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-on-surface">Voice Command Center</h1>
        <p className="text-sm text-on-surface-variant font-medium">
          Super Admin view of all Voice SaaS operations, AI agents, and telephony connections.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-outline-variant/20 pb-4">
        <Link href="/voice/admin/tenants" className="text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:underline bg-primary/10 px-4 py-2 rounded-xl">
          Tenants
        </Link>
        <Link href="/voice/admin/agents" className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary hover:underline bg-secondary/10 px-4 py-2 rounded-xl">
          Agents
        </Link>
        <Link href="/voice/admin/calls" className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface hover:underline border border-outline-variant/30 px-4 py-2 rounded-xl">
          Calls
        </Link>
        <Link href="/voice/admin/leads" className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface hover:underline border border-outline-variant/30 px-4 py-2 rounded-xl">
          Leads
        </Link>
        <Link href="/voice/admin/webhooks" className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface hover:underline border border-outline-variant/30 px-4 py-2 rounded-xl">
          Webhooks
        </Link>
        <Link href="/voice/admin/audit-logs" className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface hover:underline border border-outline-variant/30 px-4 py-2 rounded-xl">
          Audit Logs
        </Link>
        <Link href="/voice/admin/packages" className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface hover:underline border border-outline-variant/30 px-4 py-2 rounded-xl">
          Voice Packages
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Live Tenants</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-primary">{totalTenants}</p>
        </div>
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Active AI Agents</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-secondary">{activeAgents}</p>
          <p className="text-xs text-on-surface-variant mt-1">{disabledAgents} disabled</p>
        </div>
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Calls Today</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-on-surface">{callsToday}</p>
          <p className="text-xs text-on-surface-variant mt-1">{callsThisMonth} this month</p>
        </div>
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Total Leads</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-emerald-600">{totalLeads}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20 pb-3">Telephony Health</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Vapi Connected Agents</span><span className="font-bold">{connectedAgents}</span></div>
            <div className="flex justify-between text-error"><span>Missing Assistant IDs</span><span className="font-bold">{missingAssistantAgents}</span></div>
            <div className="flex justify-between text-error"><span>Missing Phone IDs</span><span className="font-bold">{missingPhoneAgents}</span></div>
            <div className="flex justify-between"><span>Voice Packages</span><span className="font-bold">{voicePackagesCount}</span></div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20 pb-3">Call Quality</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-amber-600"><span>Missed Calls</span><span className="font-bold">{missedCalls}</span></div>
            <div className="flex justify-between text-error"><span>Failed Calls</span><span className="font-bold">{failedCalls}</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Recent Failures & Errors</h2>
        {recentErrors.length === 0 ? (
          <p className="text-sm text-emerald-600 font-bold bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">No recent errors logged.</p>
        ) : (
          <div className="space-y-3">
            {recentErrors.map((err) => (
              <div key={err.id} className="p-4 rounded-xl border border-error/30 bg-error/10 flex justify-between items-center text-error">
                <div>
                  <p className="text-sm font-bold">{err.action}</p>
                  <p className="text-xs">{err.summary} - {err.organization.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{err.status}</p>
                  <p className="text-[10px]">{new Date(err.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
