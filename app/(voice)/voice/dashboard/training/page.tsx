import { VoiceTrainingCenter } from "@/components/voice/voice-training-center";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getVoiceTrainingWorkspace } from "@/modules/voice/training/service";

export default async function VoiceTrainingPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const workspace = await getVoiceTrainingWorkspace(ctx.organizationId);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-slate-950/35 px-6 py-6 text-slate-50">
        <div className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300">Business Training Profile</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Train your AI receptionist per business</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Configure identity, FAQs, hours, booking rules, order rules, handoff boundaries, and allowed actions for this
          tenant's receptionist. This data is tenant-scoped and separate from the ERP Smart Assistant.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workspace.setupChecklist.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-white/10 bg-slate-950/35 px-5 py-4 text-sm text-slate-200"
          >
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">{item.label}</div>
            <div className={`mt-3 font-semibold ${item.complete ? "text-emerald-300" : "text-amber-200"}`}>
              {item.complete ? "Configured" : "Needs setup"}
            </div>
          </div>
        ))}
      </div>

      <VoiceTrainingCenter workspace={workspace} />
    </div>
  );
}
