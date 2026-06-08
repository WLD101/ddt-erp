import { VoiceTrainingCenter } from "@/components/voice/voice-training-center";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getVoiceTrainingWorkspace } from "@/modules/voice/training/service";

export default async function VoiceTrainingPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const workspace = await getVoiceTrainingWorkspace(ctx.organizationId);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-outline-variant/30 bg-surface px-6 py-6 text-on-surface shadow-xs">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Business Training Profile</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-on-surface">Train your AI receptionist per business</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-on-surface-variant">
          Configure identity, FAQs, hours, booking rules, order rules, handoff boundaries, and allowed actions for this
          tenant's receptionist. This data is tenant-scoped and separate from the ERP Smart Assistant.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workspace.setupChecklist.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-outline-variant/20 bg-surface px-5 py-4 text-sm text-on-surface shadow-xs"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{item.label}</div>
            <div className={`mt-3 font-semibold ${item.complete ? "text-emerald-600" : "text-amber-600"}`}>
              {item.complete ? "Configured" : "Needs setup"}
            </div>
          </div>
        ))}
      </div>

      <VoiceTrainingCenter workspace={workspace} />
    </div>
  );
}
