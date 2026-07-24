import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPilotTenantAllowed } from "@/lib/security/pilot-access";
import { resolveVoiceAgentForWebhook } from "@/modules/voice/agents/service";
import { enqueueVoiceJob } from "@/modules/voice/jobs/service";
import {
  applyVoicePrivacyToVapiPayload,
  defaultVoicePrivacyPolicy,
  resolveVoicePrivacyPolicy,
} from "@/modules/voice/privacy/service";
import { extractVapiCallId } from "@/modules/voice/vapi/call-lifecycle";
import {
  buildVapiDeduplicationKey,
  encryptVapiPayload,
  hashVapiPayload,
  redactVapiPayload,
} from "@/modules/voice/vapi/event-security";

export const TRACKED_VAPI_EVENT_TYPES = new Set([
  "assistant-request",
  "status-update",
  "end-of-call-report",
  "transcript",
  'transcript[transcriptType="final"]',
  "speech-update",
  "conversation-update",
  "tool-calls",
  "transfer-update",
  "hang",
]);

type TrustedVapiMapping = {
  organizationId: string;
  voiceBusinessProfileId?: string | null;
  voiceAgentId?: string | null;
  vapiAssistantId?: string | null;
  resolvedBy?: string;
};

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseVapiWebhookEnvelope(body: unknown) {
  const envelope = asRecord(body);
  const message = asRecord(envelope.message);
  const eventType = nonEmptyString(message.type);
  if (!eventType) {
    throw new Error("Vapi webhook body must contain message.type.");
  }
  return { message, eventType };
}

export function getVapiRoutingIdentifiers(message: Record<string, any>) {
  const call = asRecord(message.call);
  const phoneNumber = {
    ...asRecord(call.phoneNumber),
    ...asRecord(message.phoneNumber),
  };
  return {
    providerCallId: extractVapiCallId(message),
    providerEventId:
      nonEmptyString(message.eventId) ||
      (nonEmptyString(message.id) !== nonEmptyString(call.id) ? nonEmptyString(message.id) : null),
    assistantId:
      nonEmptyString(call.assistantId) ||
      nonEmptyString(message.assistantId) ||
      nonEmptyString(message.assistant?.id),
    phoneNumberId:
      nonEmptyString(call.phoneNumberId) ||
      nonEmptyString(message.phoneNumberId) ||
      nonEmptyString(phoneNumber.id),
    inboundNumber:
      nonEmptyString(phoneNumber.number) ||
      nonEmptyString(call.number),
  };
}

async function resolveTrustedMapping(message: Record<string, any>) {
  const identifiers = getVapiRoutingIdentifiers(message);
  return resolveVoiceAgentForWebhook({
    assistantId: identifiers.assistantId || undefined,
    phoneNumberId: identifiers.phoneNumberId || undefined,
    inboundNumber: identifiers.inboundNumber || undefined,
    providerCallId: identifiers.providerCallId || undefined,
  });
}

export async function ingestVapiWebhook(body: unknown) {
  const { message: originalMessage, eventType } =
    parseVapiWebhookEnvelope(body);
  let mapping: TrustedVapiMapping | null =
    (await resolveTrustedMapping(originalMessage)) ?? null;
  if (mapping && !isPilotTenantAllowed(mapping.organizationId)) {
    throw new Error("The mapped tenant is not approved for the controlled pilot.");
  }
  const privacyPolicy = mapping
    ? await resolveVoicePrivacyPolicy(mapping.organizationId)
    : defaultVoicePrivacyPolicy("unresolved");
  const privacyResult = applyVoicePrivacyToVapiPayload(
    originalMessage,
    privacyPolicy,
  );
  const message = asRecord(privacyResult.payload);
  const identifiers = getVapiRoutingIdentifiers(message);
  const payloadHash = hashVapiPayload(message);
  const deduplicationKey = buildVapiDeduplicationKey({
    providerEventId: identifiers.providerEventId,
    providerCallId: identifiers.providerCallId,
    eventType,
    payloadHash,
  });
  const correlationId = identifiers.providerCallId || crypto.randomUUID();

  let webhookEvent;
  let duplicate = false;
  try {
    webhookEvent = await prisma.voiceWebhookEvent.create({
      data: {
        provider: "vapi",
        providerEventId: identifiers.providerEventId,
        providerCallId: identifiers.providerCallId,
        providerAssistantId: identifiers.assistantId,
        providerPhoneNumberId: identifiers.phoneNumberId,
        eventType,
        status: "received",
        rawPayloadJson: JSON.stringify(redactVapiPayload(message)),
        encryptedPayload: encryptVapiPayload(message),
        payloadHash,
        deduplicationKey,
        correlationId,
        organizationId: mapping?.organizationId,
        voiceBusinessProfileId: mapping?.voiceBusinessProfileId || null,
        voiceAgentId: mapping?.voiceAgentId || null,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    duplicate = true;
    webhookEvent = await prisma.voiceWebhookEvent.findUnique({
      where: { deduplicationKey },
    });
    if (!webhookEvent) throw error;
    webhookEvent = await prisma.voiceWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: { duplicateCount: { increment: 1 } },
    });
  }

  if (webhookEvent.organizationId) {
    mapping = {
      organizationId: webhookEvent.organizationId,
      voiceBusinessProfileId: webhookEvent.voiceBusinessProfileId,
      voiceAgentId: webhookEvent.voiceAgentId,
      vapiAssistantId: identifiers.assistantId,
      resolvedBy: "stored_event",
    };
  } else if (!mapping) {
    mapping = (await resolveTrustedMapping(message)) ?? null;
  }
  if (mapping && !webhookEvent.organizationId) {
    webhookEvent = await prisma.voiceWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        organizationId: mapping.organizationId,
        voiceBusinessProfileId: mapping.voiceBusinessProfileId || null,
        voiceAgentId: mapping.voiceAgentId || null,
        status:
          webhookEvent.status === "mapping_failed"
            ? "received"
            : webhookEvent.status,
        errorMessage: null,
        lastErrorCode: null,
      },
    });
  }

  await enqueueVoiceJob({
    organizationId: mapping?.organizationId,
    voiceAgentId: mapping?.voiceAgentId,
    type: "process_webhook_event",
    payload: { eventId: webhookEvent.id },
    idempotencyKey: webhookEvent.id,
    correlationId,
    entityType: "VoiceWebhookEvent",
    entityId: webhookEvent.id,
  });

  return {
    event: webhookEvent,
    eventType,
    message,
    mapping,
    duplicate,
    tracked: TRACKED_VAPI_EVENT_TYPES.has(eventType),
  };
}
