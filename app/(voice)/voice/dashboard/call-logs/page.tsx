import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceCallLogsManager } from "@/components/voice/voice-call-logs-manager";
import { getVoiceWorkspace } from "@/modules/voice/service";

export default async function VoiceCallLogsPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const workspace = await getVoiceWorkspace(ctx.organizationId);

  return (
    <VoiceCallLogsManager
      logs={workspace.callLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      }))}
      allowDevTools={process.env.NODE_ENV !== "production"}
    />
  );
}
