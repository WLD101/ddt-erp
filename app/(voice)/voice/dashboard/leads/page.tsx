import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceLeadsManager } from "@/components/voice/voice-leads-manager";
import { getVoiceWorkspace } from "@/modules/voice/service";

export default async function VoiceLeadsPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const workspace = await getVoiceWorkspace(ctx.organizationId);

  return (
    <VoiceLeadsManager
      leads={workspace.leads.map((lead) => ({
        ...lead,
        createdAt: lead.createdAt.toISOString(),
      }))}
    />
  );
}
