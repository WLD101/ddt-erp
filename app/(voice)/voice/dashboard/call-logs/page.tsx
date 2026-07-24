import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceCallLogsManager } from "@/components/voice/voice-call-logs-manager";
import { getVoiceWorkspace } from "@/modules/voice/service";
import { resolveVoicePrivacyPolicy } from "@/modules/voice/privacy/service";

export default async function VoiceCallLogsPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const [workspace, privacyPolicy] = await Promise.all([
    getVoiceWorkspace(ctx.organizationId),
    resolveVoicePrivacyPolicy(ctx.organizationId),
  ]);

  return (
    <VoiceCallLogsManager
      logs={workspace.callLogs.map((log) => {
        return {
          id: log.id,
          callerNumber: log.callerNumber,
          callStatus: log.callStatus,
          callDirection: log.callDirection,
          summary: log.summary,
          transcriptPlaceholder: log.transcriptPlaceholder,
          transcript:
            privacyPolicy.transcriptionEnabled &&
            privacyPolicy.allowTranscriptAccess
              ? log.transcript
              : null,
          recordingHref:
            privacyPolicy.recordingEnabled &&
            privacyPolicy.allowRecordingPlayback &&
            (!privacyPolicy.recordingDisclosureEnabled ||
              log.recordingDisclosureStatus === "completed") &&
            log.recordingUrl
              ? `/api/voice/call-logs/${log.id}/recording`
              : null,
          endedReason: log.endedReason,
          providerCallId: log.providerCallId,
          durationSeconds: log.durationSeconds,
          appointmentRequested: log.appointmentRequested,
          createdAt: log.createdAt.toISOString(),
        };
      })}
      allowDevTools={process.env.NODE_ENV !== "production"}
    />
  );
}
