import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { assignPackageAction, approveManualPaymentAction, rejectManualPaymentAction } from "./actions";
import { signOutAction } from "@/modules/auth/actions";

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

  const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_replace_me";

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
    allOrganizations,
    voicePackages,
    pendingPayments,
    recentWebhookEvents,
    trialOrganizations,
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
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
    prisma.package.findMany({ where: { productType: "VOICE", isActive: true } }),
    prisma.subscription.findMany({
      where: {
        OR: [
          { status: "payment_pending" },
          { paymentStatus: "payment_pending" }
        ]
      },
      select: {
        id: true,
        organizationId: true,
        packageId: true,
        status: true,
        paymentStatus: true,
        manualPaymentMethod: true,
        manualPaymentReference: true,
      },
    }),
    prisma.voiceWebhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.organization.findMany({
      where: { subscription: { status: "trialing" } },
      select: {
        id: true,
        name: true,
        email: true,
        subscription: { select: { currentPeriodEnd: true } },
        VoiceUsageMeter: { select: { callMinutesThisMonth: true, callsThisMonth: true } }
      }
    }),
  ]);

  const disabledAgents = totalAgents - activeAgents;
  const connectedAgents = totalAgents - missingAssistantAgents;
  const activeCalls = Number(activeCallsData._sum.activeCalls || 0);
  const totalCostToday = Number(totalCostTodayAgg._sum.costUsd || 0);
  const totalCostThisMonth = Number(totalCostThisMonthAgg._sum.costUsd || 0);

  const [organizations, agents] = await Promise.all([
    prisma.organization.findMany({
      where: { id: { in: [...new Set(costByBusinessRows.map((row) => row.organizationId).filter(Boolean) as string[])] } },
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
    <div className="pb-12 text-on-surface">
      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        
        <section className="overflow-hidden rounded-[32px] border border-outline-variant/30 bg-surface shadow-sm">
          <div className="flex flex-col gap-8 px-8 py-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20">
                  Overview
                </Badge>
              </div>
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
          <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/20 px-8 py-4 bg-slate-900/5">
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

        {/* Priority Actions & Stripe config */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Admin Control Cards */}
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">admin_panel_settings</span>
                Administrative Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/voice/admin/tenants/new" className="w-full">
                  <Button className="w-full h-11 rounded-xl bg-primary text-on-primary text-[10px] font-black uppercase tracking-wider shadow-md shadow-primary/15">
                    <span className="material-symbols-outlined mr-2 text-[16px]">add_box</span>
                    Create Tenant
                  </Button>
                </Link>
                <Link href="/voice/admin/packages/new" className="w-full">
                  <Button variant="outline" className="w-full h-11 rounded-xl border-outline-variant text-[10px] font-black uppercase tracking-wider">
                    <span className="material-symbols-outlined mr-2 text-[16px]">inventory_2</span>
                    Create Package
                  </Button>
                </Link>
              </div>
              <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4 space-y-2 text-xs">
                <div className="font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-cyan-500">info</span>
                  AI Receptionist Deployment Note:
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  AI Receptionists must be created within tenant contexts. Go to 
                  <Link href="/voice/admin/tenants" className="text-primary font-bold hover:underline mx-1">Tenants</Link> 
                  and click <strong>Manage Tenant</strong> &rarr; <strong>AI Receptionist</strong> to launch the setup wizard.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Config health card */}
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">credit_card</span>
                Stripe Gateway Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col justify-between h-[155px]">
              <div>
                {isStripeConfigured ? (
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-sm font-black text-emerald-500 uppercase tracking-widest">Stripe Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-sm font-black text-rose-500 uppercase tracking-widest">Stripe Not Configured</span>
                  </div>
                )}
                <p className="mt-2.5 text-xs text-on-surface-variant leading-relaxed">
                  {isStripeConfigured
                    ? "Automatic online subscription plans and Stripe webhooks are active."
                    : "The system is running on manual package overrides. Safe billing fallbacks are enabled: assign packages manually and approve payment receipts offline."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trial Quota Usage */}
          <Card className={`${shellCardClassName} md:col-span-2`}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">hourglass_top</span>
                Trial Quota Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {trialOrganizations.length === 0 ? (
                <div className="p-6 text-sm text-on-surface-variant italic">No organizations currently in trial.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/10 bg-surface-container-lowest text-[10px] uppercase tracking-widest text-on-surface-variant">
                        <th className="px-6 py-3 font-black">Organization</th>
                        <th className="px-6 py-3 font-black">Trial Ends</th>
                        <th className="px-6 py-3 font-black">Calls</th>
                        <th className="px-6 py-3 font-black">Minutes Used</th>
                        <th className="px-6 py-3 font-black text-right">Quota Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {trialOrganizations.map((org) => {
                        const minutesUsed = org.VoiceUsageMeter?.callMinutesThisMonth || 0;
                        const callsUsed = org.VoiceUsageMeter?.callsThisMonth || 0;
                        const trialLimit = 50;
                        const isExceeded = minutesUsed >= trialLimit;
                        
                        return (
                          <tr key={org.id} className="transition-colors hover:bg-surface-container/30">
                            <td className="px-6 py-4">
                              <div className="font-bold text-on-surface">{org.name}</div>
                              <div className="text-xs text-on-surface-variant">{org.email}</div>
                            </td>
                            <td className="px-6 py-4 font-medium text-on-surface">
                              {org.subscription?.currentPeriodEnd ? new Date(org.subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="px-6 py-4 font-black text-on-surface">{callsUsed}</td>
                            <td className="px-6 py-4 font-black text-on-surface">{minutesUsed} / {trialLimit}</td>
                            <td className="px-6 py-4 text-right">
                              {isExceeded ? (
                                <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20">Exceeded</Badge>
                              ) : (
                                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Active</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Package Assignment & Manual Payments override panel */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Package Assignment form override */}
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">assignment_ind</span>
                Assign Package Override
              </CardTitle>
              <CardDescription className="text-xs text-on-surface-variant">Manually attach or modify a tenant's billing tier.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form action={assignPackageAction} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Select Tenant</label>
                  <select name="organizationId" required className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none">
                    <option value="" disabled selected>Select tenant organization...</option>
                    {allOrganizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name} ({org.slug})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Select Voice Package</label>
                  <select name="packageId" className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none">
                    <option value="">No Active Package (Remove Access)</option>
                    {voicePackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full h-10 mt-2 rounded-xl bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest shadow-md">
                  Update Assignment
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Pending Manual Payments actions */}
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">pending_actions</span>
                Pending Manual Payments ({pendingPayments.length})
              </CardTitle>
              <CardDescription className="text-xs text-on-surface-variant">Approve or reject bank transfers/cash billing overrides.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[268px] overflow-y-auto custom-scrollbar">
              {pendingPayments.length === 0 ? (
                <div className="flex h-[130px] flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-[36px] text-outline-variant">check_circle</span>
                  <p className="mt-2 text-xs font-semibold text-on-surface-variant">No pending payments to review.</p>
                </div>
              ) : (
                pendingPayments.map(sub => (
                  <div key={sub.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 flex flex-col justify-between gap-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-on-surface">{organizationMap.get(sub.organizationId) ?? sub.organizationId}</div>
                        <div className="text-[10px] uppercase font-semibold text-on-surface-variant mt-0.5">
                          Package: {voicePackages.find(p => p.id === sub.packageId)?.name || "Unknown"}
                        </div>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase">
                        Pending
                      </Badge>
                    </div>
                    {sub.manualPaymentMethod && (
                      <div className="bg-black/5 rounded-lg p-2 text-[11px] text-on-surface-variant">
                        <strong>Method:</strong> {sub.manualPaymentMethod} {sub.manualPaymentReference ? `• Ref: ${sub.manualPaymentReference}` : ""}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <form action={approveManualPaymentAction} className="flex-1">
                        <input type="hidden" name="organizationId" value={sub.organizationId} />
                        <Button type="submit" className="w-full h-8 bg-emerald-600 hover:bg-emerald-500 text-on-primary text-[9px] font-black uppercase tracking-wider rounded-lg">
                          Approve
                        </Button>
                      </form>
                      <form action={rejectManualPaymentAction} className="flex-1">
                        <input type="hidden" name="organizationId" value={sub.organizationId} />
                        <Button type="submit" variant="outline" className="w-full h-8 border-rose-500/30 text-rose-500 hover:bg-rose-500/5 text-[9px] font-black uppercase tracking-wider rounded-lg">
                          Reject
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* Usage metrics / numbers */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon="call" label="Active Calls Now" value={activeCalls} tone="primary" subtitle={`${capacityFullEvents} capacity drops`} />
          <MetricCard icon="today" label="Calls Today" value={callsToday} tone="default" subtitle={`${callsThisMonth} this month`} />
          <MetricCard icon="contact_mail" label="Total Leads Captured" value={totalLeads} tone="secondary" subtitle="Since inception" />
          <MetricCard icon="payments" label="Vapi Cost Today" value={`$${totalCostToday.toFixed(2)}`} tone="default" subtitle={`$${totalCostThisMonth.toFixed(2)} this month`} />
        </section>

        {/* Health status metrics card */}
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

        {/* Tenant costing & Webhook health log */}
        <section className="grid gap-6 xl:grid-cols-2">
          {/* Top 10 Costing Tenants */}
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
                    <div className="font-black text-primary">${Number(row._sum.costUsd || 0).toFixed(2)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Webhook Health Log list */}
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">api</span>
                  Recent Webhook Events
                </CardTitle>
              </div>
              <Link href="/voice/admin/webhooks" className="text-xs font-semibold text-primary hover:underline">
                View all &rarr;
              </Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-4 space-y-3">
              {recentWebhookEvents.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No webhook events logged yet.</p>
              ) : (
                recentWebhookEvents.map((evt) => (
                  <div key={evt.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-on-surface">{evt.eventType}</div>
                      <Badge variant="outline" className={
                        evt.status === "processed"
                          ? "border-emerald-500/30 text-emerald-500"
                          : evt.status === "failed"
                          ? "border-rose-500/30 text-rose-500"
                          : "border-amber-500/30 text-amber-500"
                      }>
                        {evt.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Call ID: {evt.providerCallId || "N/A"}</span>
                      <span>{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                    </div>
                    {evt.errorMessage && (
                      <div className="text-[11px] text-rose-500 bg-rose-50/5 rounded border border-rose-500/10 p-1.5 font-mono break-all">
                        {evt.errorMessage}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}