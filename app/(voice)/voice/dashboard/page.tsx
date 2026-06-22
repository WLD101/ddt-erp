import Link from "next/link";

import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";
import { getVoiceDashboardSummary } from "@/modules/voice/service";

export default async function VoiceDashboardPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const host = await getVoiceRequestHost();
  const summary = await getVoiceDashboardSummary(ctx.organizationId);

  const statCards = [
    ["Total leads", summary.stats.totalLeads, "Captured receptionist leads from the voice workspace database."],
    ["Total calls", summary.stats.totalCalls, "Call records will stay at zero until provider webhooks are connected."],
    ["Missed calls", summary.stats.missedCalls, "Missed state is database-backed and will rise once live call events arrive."],
    ["Reservations", summary.stats.appointmentsRequested, "Tracks booking requests captured for team confirmation, not confirmed tables."],
    ["Order requests", summary.stats.orderRequests, "Takeaway and order requests stay in the voice queue until staff confirms details."],
    ["Callback requests", summary.stats.callbackRequests, "Human handoff requests are saved for follow-up without triggering outbound actions."],
    ["Calls this month", summary.usage.callsThisMonth, `Current package usage across this tenant. Remaining limit: ${summary.usage.remaining}/${summary.usage.limit}.`],
    ["Minutes this month", summary.usage.minutesThisMonth, "Tracked from completed call logs so tenants can see monthly voice usage."],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map(([label, value, description]) => (
          <div key={label} className="rounded-[26px] border border-outline-variant/30 bg-surface p-5 shadow-xs">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{label}</div>
            <div className="mt-3 text-4xl font-black tracking-tight text-on-surface">{value}</div>
            <p className="mt-3 text-xs leading-6 text-on-surface-variant">{description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Business profile</div>
          {summary.businessProfile ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Business name</div>
                <div className="mt-2 text-2xl font-black text-on-surface">{summary.businessProfile.businessName}</div>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Primary goal</div>
                <div className="mt-2 text-xl font-black text-on-surface">{summary.businessProfile.mainGoal?.replaceAll("_", " ") || "Not set"}</div>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Language</div>
                <div className="mt-2 text-xl font-black text-on-surface">{summary.businessProfile.preferredLanguage?.replaceAll("_", " ") || "Not set"}</div>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Business phone</div>
                <div className="mt-2 text-xl font-black text-on-surface">{summary.businessProfile.businessPhone || "Not set"}</div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] border border-dashed border-outline-variant/40 bg-surface-container-low/40 px-5 py-8 text-sm text-on-surface-variant">
              No voice business profile has been saved yet. Finish onboarding before expecting live receptionist behavior.
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Setup status</div>
          <div className="mt-5 space-y-3">
            {summary.setupChecklist.map((item, index) => (
              <div key={item.label} className="flex items-start gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                    item.complete ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-outline-variant/40 text-on-surface-variant"
                  }`}
                >
                  {item.complete ? "✓" : index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-on-surface">{item.label}</div>
                  <div className="text-xs leading-5 text-on-surface-variant">{item.complete ? "Configured" : "Pending"}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={toVoiceExternalPath("/onboarding", host)}
              className="rounded-full bg-primary px-4 py-2 text-sm font-black text-on-primary transition hover:bg-primary/95 shadow-sm"
            >
              Review onboarding
            </Link>
            <Link
              href={toVoiceExternalPath("/dashboard/settings", host)}
              className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
            >
              Open settings
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Monthly usage</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Package usage</div>
              <div className="mt-2 text-3xl font-black text-on-surface">
                {summary.usage.callsThisMonth} / {summary.usage.limit}
              </div>
              <div className="mt-2 text-xs text-on-surface-variant">{summary.usage.remaining} calls remaining this month</div>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Call minutes</div>
              <div className="mt-2 text-3xl font-black text-on-surface">{summary.usage.minutesThisMonth}</div>
              <div className="mt-2 text-xs text-on-surface-variant">Measured from completed or ended calls only.</div>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 md:col-span-2">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Estimated cost</div>
              <div className="mt-2 text-3xl font-black text-on-surface">
                {summary.usage.showEstimatedCost ? `$${Number(summary.usage.estimatedCostUsdThisMonth || 0).toFixed(2)}` : "Hidden by package"}
              </div>
              <div className="mt-2 text-xs text-on-surface-variant">
                {summary.usage.showEstimatedCost
                  ? "Shown only for this tenant and sourced from provider cost data captured on call logs."
                  : "Estimated provider cost is not exposed on your current package or tenant settings."}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Limit status</div>
          <div className="mt-5 space-y-3">
            {summary.usage.warnings.length > 0 ? (
              summary.usage.warnings.map((warning) => (
                <div key={warning} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-700">
                  {warning === "APPROACHING_CALL_LIMIT"
                    ? "You are nearing your monthly voice call limit."
                    : "You have reached your monthly voice call limit."}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700">
                Voice usage is within your current package allowance.
              </div>
            )}
            <p className="text-xs leading-6 text-on-surface-variant">
              Tenant usage and cost data are isolated to your organization only. No other business can see your call minutes,
              package usage, or estimated provider spend.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
