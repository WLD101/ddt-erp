import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveVoiceAgentForWebhook } from "@/modules/voice/agents/service";
import { getVoiceTrainingWorkspace } from "@/modules/voice/training/service";
import { getVapiEnvStatus, validateWebhookSecret } from "@/modules/voice/vapi/service";
import { handleToolCall } from "@/modules/voice/vapi/tools";

type VapiEventMessage = {
  type?: string;
  status?: string;
  assistantId?: string;
  durationSeconds?: number;
  endedReason?: string;
  summary?: string;
  transcript?: string;
  recordingUrl?: string;
  call?: {
    id?: string;
    assistantId?: string;
    phoneNumberId?: string;
    customer?: {
      number?: string;
      phoneNumber?: string;
    };
  };
  toolWithToolCallList?: Array<{
    id?: string;
    function?: { name?: string; arguments?: Record<string, unknown> | string };
  }>;
  toolCalls?: Array<{
    id?: string;
    function?: { name?: string; arguments?: Record<string, unknown> | string };
  }>;
};

function getCallerNumber(message: VapiEventMessage) {
  return (
    message.call?.customer?.number ||
    message.call?.customer?.phoneNumber ||
    null
  );
}

function normalizeCallStatus(status?: string) {
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

function isMissedStatus(status?: string, endedReason?: string | null) {
  const normalizedStatus = normalizeCallStatus(status);
  const normalizedReason = endedReason?.toLowerCase() ?? "";

  return normalizedStatus === "MISSED" || normalizedReason.includes("missed");
}

async function touchIntegrationWebhook(
  organizationId: string,
  type: string,
) {
  await prisma.voiceIntegrationSettings.upsert({
    where: { organizationId },
    update: {
      vapiStatus: "CONFIGURED",
      vapiWebhookUrl: getVapiEnvStatus().webhookUrl || undefined,
      lastWebhookAt: new Date(),
      lastWebhookType: type,
    },
    create: {
      organizationId,
      vapiStatus: "CONFIGURED",
      twilioStatus: "NOT_CONNECTED",
      googleCalendarStatus: "NOT_CONNECTED",
      whatsappFollowUpStatus: "NOT_CONNECTED",
      vapiWebhookUrl: getVapiEnvStatus().webhookUrl || null,
      lastWebhookAt: new Date(),
      lastWebhookType: type,
    },
  });
}

async function upsertCallLog({
  organizationId,
  voiceAgentId,
  message,
  callStatus,
}: {
  organizationId: string;
  voiceAgentId?: string | null;
  message: VapiEventMessage;
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

  if (existing) {
    return prisma.voiceCallLog.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.voiceCallLog.create({
    data: {
      organizationId,
      ...payload,
    },
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-vapi-secret");
  if (!validateWebhookSecret(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const message = body.message as VapiEventMessage | undefined;
  if (!message) {
    return NextResponse.json({ error: "No message found" }, { status: 400 });
  }

  try {
    const type = message.type || "unknown";
    const assistantId = message.call?.assistantId || message.assistantId;
    const phoneNumberId = message.call?.phoneNumberId;
    const providerCallId = message.call?.id;
    const mapping = await resolveVoiceAgentForWebhook({
      assistantId,
      phoneNumberId,
      providerCallId,
      tenantHeader: req.headers.get("x-tenant-id"),
    });

    if (!mapping?.organizationId) {
      console.warn("[Vapi Webhook] Could not securely map event to a tenant.", {
        type,
        assistantId,
        phoneNumberId,
        providerCallId,
      });
      return NextResponse.json({
        success: true,
        warning: "Unmapped tenant",
      });
    }

    const { organizationId, voiceAgentId } = mapping;

    await touchIntegrationWebhook(organizationId, type);

    if (type === "assistant-request") {
      const trainingWorkspace = await getVoiceTrainingWorkspace(organizationId, {
        voiceAgentId,
      });

      return NextResponse.json({
        assistant: {
          model: {
            messages: [{ role: "system", content: trainingWorkspace.promptPreview }],
          },
        },
      });
    }

    if (type === "status-update") {
      await upsertCallLog({
        organizationId,
        voiceAgentId,
        message,
        callStatus: normalizeCallStatus(message.status),
      });

      return NextResponse.json({ success: true });
    }

    if (type === "tool-calls") {
      const toolCalls = message.toolWithToolCallList || message.toolCalls || [];
      const results = [];

      for (const tc of toolCalls) {
        const funcName = tc.function?.name || "";
        const args = tc.function?.arguments || {};
        const result = await handleToolCall(funcName, args, organizationId, {
          voiceAgentId,
          providerCallId,
          callerNumber: getCallerNumber(message),
          providerAssistantId: assistantId,
          providerPhoneNumberId: phoneNumberId,
        });

        results.push({
          toolCallId: tc.id,
          result,
        });
      }

      return NextResponse.json({ results });
    }

    if (type === "end-of-call-report") {
      await upsertCallLog({
        organizationId,
        voiceAgentId,
        message,
        callStatus: normalizeCallStatus(message.status || "completed"),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, unhandled: true });
  } catch (error) {
    console.error("[Vapi Webhook] Uncaught error:", error);
    return NextResponse.json({
      success: false,
      error: "Webhook processing failed safely.",
    });
  }
}
