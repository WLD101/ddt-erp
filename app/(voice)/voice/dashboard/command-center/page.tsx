import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getVoiceCommandCenterOverview } from "@/modules/voice/command-center/service";
import { VoiceCommandCenter } from "@/components/voice/voice-command-center";

export default async function VoiceCommandCenterPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const overview = await getVoiceCommandCenterOverview(ctx.organizationId);

  return <VoiceCommandCenter overview={overview} />;
}
