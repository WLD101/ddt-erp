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
    ["Appointments requested", summary.stats.appointmentsRequested, "Tracks manual test leads and future booking-intent calls."],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-4">
        {statCards.map(([label, value, description]) => (
          <div key={label} className="rounded-[26px] border border-white/10 bg-slate-950/35 p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">{label}</div>
            <div className="mt-3 text-4xl font-black text-white">{value}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">Business profile</div>
          {summary.businessProfile ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Business name</div>
                <div className="mt-2 text-2xl font-black text-white">{summary.businessProfile.businessName}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Primary goal</div>
                <div className="mt-2 text-xl font-black text-white">{summary.businessProfile.mainGoal.replaceAll("_", " ")}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Language</div>
                <div className="mt-2 text-xl font-black text-white">{summary.businessProfile.preferredLanguage.replaceAll("_", " ")}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Business phone</div>
                <div className="mt-2 text-xl font-black text-white">{summary.businessProfile.businessPhone || "Not set"}</div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-slate-950/35 px-5 py-8 text-sm text-slate-300">
              No voice business profile has been saved yet. Finish onboarding before expecting live receptionist behavior.
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">Setup status</div>
          <div className="mt-5 space-y-3">
            {summary.setupChecklist.map((item, index) => (
              <div key={item.label} className="flex items-start gap-4 rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                    item.complete ? "bg-emerald-400 text-slate-950" : "bg-slate-700 text-slate-100"
                  }`}
                >
                  {item.complete ? "✓" : index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-white">{item.label}</div>
                  <div className="text-xs leading-5 text-slate-400">{item.complete ? "Configured" : "Pending"}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={toVoiceExternalPath("/onboarding", host)}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            >
              Review onboarding
            </Link>
            <Link
              href={toVoiceExternalPath("/dashboard/settings", host)}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/5"
            >
              Open settings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
