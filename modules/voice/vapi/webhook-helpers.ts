import { prisma } from "@/lib/prisma";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";

export function getCallerNumber(message: any) {
  return (
    message.call?.customer?.number ||
    message.call?.customer?.phoneNumber ||
    null
  );
}

export function normalizeCallStatus(status?: string) {
  const normalized = status?.trim().toLowerCase();

  switch (normalized) {
    case "ended":
    case "completed":
      return "COMPLETED";
    case "missed":
      return "MISSED";
    case "voicemail":
      return "VOICEMAIL";
    case "abandoned":
      return "ABANDONED";
    default:
      return normalized ? normalized.toUpperCase() : "IN_PROGRESS";
  }
}

export function isMissedStatus(status?: string, endedReason?: string | null) {
  const normalizedStatus = normalizeCallStatus(status);
  const normalizedReason = endedReason?.toLowerCase() ?? "";

  return normalizedStatus === "MISSED" || normalizedReason.includes("missed");
}

export async function touchIntegrationWebhook(
  organizationId: string,
  type: string,
  assistantId?: string | null,
) {
  const existing = await prisma.voiceIntegrationSettings.findUnique({
    where: { organizationId }
  });

  if (existing) {
    await prisma.voiceIntegrationSettings.update({
      where: { organizationId },
      data: {
        vapiStatus: "CONFIGURED",
        vapiWebhookUrl: getVapiEnvStatus().webhookUrl || undefined,
        lastWebhookAt: new Date(),
        lastWebhookType: type,
        ...(assistantId && !existing.vapiAssistantId ? { vapiAssistantId: assistantId } : {})
      },
    });
  } else {
    await prisma.voiceIntegrationSettings.create({
      data: {
        organizationId,
        vapiStatus: "CONFIGURED",
        twilioStatus: "NOT_CONNECTED",
        googleCalendarStatus: "NOT_CONNECTED",
        whatsappFollowUpStatus: "NOT_CONNECTED",
        vapiWebhookUrl: getVapiEnvStatus().webhookUrl || null,
        lastWebhookAt: new Date(),
        lastWebhookType: type,
        vapiAssistantId: assistantId || null,
      },
    });
  }
}

export async function upsertCallLog({
  organizationId,
  voiceAgentId,
  message,
  callStatus,
}: {
  organizationId: string;
  voiceAgentId?: string | null;
  message: any;
  callStatus: string;
}) {
  const providerCallId = message.call?.id;
  const callerNumber = getCallerNumber(message) || "Unknown";
  const existing = providerCallId
    ? await prisma.voiceCallLog.findFirst({
        where: { organizationId, providerCallId },
      })
    : null;

  const payload = {
    provider: "vapi",
    providerCallId: providerCallId || existing?.providerCallId || null,
    providerPhoneNumberId: message.call?.phoneNumberId || existing?.providerPhoneNumberId || null,
    providerAssistantId: message.call?.assistantId || message.assistantId || existing?.providerAssistantId || null,
    callerNumber,
    callStatus,
    voiceAgentId: voiceAgentId || existing?.voiceAgentId || null,
    callDirection: existing?.callDirection || "INBOUND",
    startedAt: existing?.startedAt || new Date(),
    summary: message.summary || existing?.summary || null,
    transcript: message.transcript || existing?.transcript || null,
    transcriptPlaceholder: existing?.transcriptPlaceholder || null,
    durationSeconds: message.durationSeconds ?? existing?.durationSeconds ?? null,
    endedReason: message.endedReason || existing?.endedReason || null,
    rawEventJson: JSON.stringify(message),
    recordingUrl: message.recordingUrl || existing?.recordingUrl || null,
    isMissed: isMissedStatus(callStatus, message.endedReason),
    endedAt:
      callStatus === "COMPLETED" || callStatus === "MISSED" || callStatus === "VOICEMAIL" || callStatus === "ABANDONED"
        ? new Date()
        : existing?.endedAt || null,
  };

  let logRecord;
  if (existing) {
    logRecord = await prisma.voiceCallLog.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    logRecord = await prisma.voiceCallLog.create({
      data: {
        organizationId,
        ...payload,
      },
    });
  }

  if (callStatus === "COMPLETED" || callStatus === "MISSED" || callStatus === "VOICEMAIL") {
    if (!existing || (existing.callStatus !== "COMPLETED" && existing.callStatus !== "MISSED" && existing.callStatus !== "VOICEMAIL")) {
      const { incrementUsageStat } = await import("@/modules/voice/billing/usage");
      await incrementUsageStat(organizationId, "calls", payload.durationSeconds || 1);
    }
  }

  return logRecord;
}
