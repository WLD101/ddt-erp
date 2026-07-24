import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { redactSensitiveText } from "@/lib/security/redaction";
import { getCallerNumber, touchIntegrationWebhook } from "@/modules/voice/vapi/webhook-helpers";
import { resolveVoiceAgentForWebhook } from "@/modules/voice/agents/service";
import { handleToolCall } from "@/modules/voice/vapi/tools";
import { upsertVapiCallLedger } from "@/modules/voice/vapi/call-ledger";
import { decryptVapiPayload } from "@/modules/voice/vapi/event-security";
import { getVapiPrivateApiKey } from "@/modules/voice/vapi/service";

const VOICE_WORKER_VERSION = "vapi-ledger-v1";
const PROCESSABLE_VAPI_EVENTS = new Set([
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

export async function enqueueVoiceJob({
  organizationId,
  voiceAgentId,
  type,
  payload,
  scheduledAt,
  idempotencyKey,
  correlationId,
  entityType,
  entityId,
}: {
  organizationId?: string | null;
  voiceAgentId?: string | null;
  type: string;
  payload: unknown;
  scheduledAt?: Date;
  idempotencyKey?: string | null;
  correlationId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) {
  const data = {
    organizationId: organizationId || null,
    voiceAgentId: voiceAgentId || null,
    type,
    payloadJson: JSON.stringify(payload),
    scheduledAt: scheduledAt || new Date(),
    idempotencyKey: idempotencyKey || null,
    correlationId: correlationId || null,
    entityType: entityType || null,
    entityId: entityId || null,
  };

  if (idempotencyKey) {
    return prisma.voiceJob.upsert({
      where: {
        type_idempotencyKey: {
          type,
          idempotencyKey,
        },
      },
      update: {},
      create: data,
    });
  }

  return prisma.voiceJob.create({
    data: {
      ...data,
    },
  });
}

export async function processVoiceJobs(limit = 10) {
  const now = new Date();
  const workerId = `voice-${process.pid}-${crypto.randomUUID()}`;
  const candidates = await prisma.voiceJob.findMany({
    where: {
      scheduledAt: { lte: new Date() },
      OR: [
        { status: { in: ["queued", "retrying"] } },
        { status: "processing", leaseExpiresAt: { lte: now } },
      ],
    },
    orderBy: { scheduledAt: "asc" },
    take: Math.max(limit * 2, limit),
  });

  if (candidates.length === 0) return { processed: 0, successful: 0, failed: 0 };

  let successful = 0;
  let failed = 0;
  let processed = 0;

  for (const candidate of candidates) {
    if (processed >= limit) break;
    const leaseExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const claimed = await prisma.voiceJob.updateMany({
      where: {
        id: candidate.id,
        scheduledAt: { lte: now },
        OR: [
          { status: { in: ["queued", "retrying"] } },
          { status: "processing", leaseExpiresAt: { lte: now } },
        ],
      },
      data: {
        status: "processing",
        startedAt: candidate.startedAt || now,
        lockedAt: now,
        lockedBy: workerId,
        leaseExpiresAt,
        lastHeartbeatAt: now,
        workerVersion: VOICE_WORKER_VERSION,
        attempts: { increment: 1 },
      },
    });
    if (claimed.count === 0) continue;

    processed++;
    const attemptNumber = candidate.attempts + 1;
    try {
      const payload = candidate.payloadJson ? JSON.parse(candidate.payloadJson) : {};

      switch (candidate.type) {
        case "process_webhook_event":
          await processWebhookEventJob(payload);
          break;
        case "reconcile_vapi_calls": {
          const { reconcileVapiCalls } = await import("@/modules/voice/vapi/reconciliation");
          await reconcileVapiCalls({
            from: new Date(payload.from),
            to: new Date(payload.to),
            apply: true,
            repair: true,
            pageSize: payload.pageSize,
            maxPages: payload.maxPages,
          });
          break;
        }
        case "sync_vapi_agent":
          throw new Error("sync_vapi_agent is disabled until a production adapter is configured.");
        case "apply_data_retention": {
          const { applyDataRetention } = await import("@/modules/security/data-retention");
          await applyDataRetention();
          break;
        }
        case "send_whatsapp_notification":
          await processWhatsAppNotificationJob(
            payload,
            candidate.organizationId,
            candidate.voiceAgentId,
          );
          break;
        default:
          throw new Error("Unsupported voice job type.");
      }

      await prisma.voiceJob.update({
        where: { id: candidate.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          leaseExpiresAt: null,
          lockedAt: null,
          lockedBy: null,
          lastHeartbeatAt: new Date(),
          lastError: null,
          failureCode: null,
        },
      });
      successful++;
    } catch (error) {
      console.error("[Voice Job] Processing failed.", {
        jobId: candidate.id,
        jobType: candidate.type,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      const errorMessage = redactSensitiveText(
        error instanceof Error ? error.message : "Unknown error",
      );
      const failureCode =
        error instanceof Error && "code" in error
          ? String((error as Error & { code?: string }).code || "VOICE_JOB_FAILED")
          : "VOICE_JOB_FAILED";
      const willRetry = attemptNumber < candidate.maxAttempts;

      await prisma.voiceJob.update({
        where: { id: candidate.id },
        data: {
          status: willRetry ? "retrying" : "failed",
          lastError: errorMessage,
          failureCode,
          scheduledAt: willRetry
            ? new Date(Date.now() + Math.pow(2, attemptNumber) * 60_000)
            : candidate.scheduledAt,
          deadLetteredAt: willRetry ? null : new Date(),
          leaseExpiresAt: null,
          lockedAt: null,
          lockedBy: null,
        },
      });
      if (!willRetry && candidate.entityType === "VoiceWebhookEvent" && candidate.entityId) {
        await prisma.voiceWebhookEvent.updateMany({
          where: { id: candidate.entityId },
          data: {
            status: "failed",
            deadLetteredAt: new Date(),
            lastErrorCode: failureCode,
            errorMessage,
          },
        });
      }
      failed++;
    }
  }

  return { processed, successful, failed };
}

async function processWebhookEventJob(payload: any) {
  const eventId = payload.eventId;
  if (!eventId) throw new Error("Missing eventId in process_webhook_event payload");

  const event = await prisma.voiceWebhookEvent.findUnique({ where: { id: eventId } });
  if (!event || event.status === "processed" || event.status === "ignored") return;

  await prisma.voiceWebhookEvent.update({
    where: { id: eventId },
    data: {
      status: "processing",
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
      errorMessage: null,
      lastErrorCode: null,
    },
  });

  try {
    const message =
      decryptVapiPayload(event.encryptedPayload) ||
      (event.rawPayloadJson ? JSON.parse(event.rawPayloadJson) : {});
    const type = event.eventType;
    let organizationId = event.organizationId;
    let voiceBusinessProfileId = event.voiceBusinessProfileId;
    let voiceAgentId = event.voiceAgentId;

    if (!organizationId) {
      const call = message.call || message;
      const mapping = await resolveVoiceAgentForWebhook({
        assistantId: call?.assistantId || message.assistantId || undefined,
        phoneNumberId:
          call?.phoneNumberId ||
          call?.phoneNumber?.id ||
          message.phoneNumberId ||
          message.phoneNumber?.id ||
          undefined,
        inboundNumber:
          call?.phoneNumber?.number ||
          message.phoneNumber?.number ||
          undefined,
        providerCallId: event.providerCallId || call?.id || undefined,
      });
      organizationId = mapping?.organizationId || null;
      voiceBusinessProfileId = mapping?.voiceBusinessProfileId || null;
      voiceAgentId = mapping?.voiceAgentId || null;
    }

    if (!organizationId) {
      await prisma.voiceWebhookEvent.update({
        where: { id: eventId },
        data: {
          status: "mapping_failed",
          lastErrorCode: "TENANT_UNRESOLVED",
          errorMessage: "No trusted Vapi assistant, phone-number, or existing-call mapping was found.",
        },
      });
      const mappingError = new Error("Vapi call tenant mapping is unresolved.") as Error & {
        code?: string;
      };
      mappingError.code = "TENANT_UNRESOLVED";
      throw mappingError;
    }

    if (!event.organizationId) {
      await prisma.voiceWebhookEvent.update({
        where: { id: eventId },
        data: {
          organizationId,
          voiceBusinessProfileId,
          voiceAgentId,
        },
      });
    }

    await touchIntegrationWebhook(organizationId, type, event.providerAssistantId);

    if (!PROCESSABLE_VAPI_EVENTS.has(type)) {
      await prisma.voiceWebhookEvent.update({
        where: { id: eventId },
        data: { status: "ignored", processedAt: new Date() },
      });
      return;
    }

    const isFinalTranscript =
      type !== "transcript" ||
      message.transcriptType === "final" ||
      type.includes('transcriptType="final"');
    if (isFinalTranscript) {
      const callLog = await upsertVapiCallLedger(
        {
          organizationId,
          voiceBusinessProfileId,
          voiceAgentId,
        },
        message,
        {
          source: "provider_payload",
          receivedAt: event.receivedAt,
          finalizeAccounting: type === "end-of-call-report",
        },
      );

      if (type === "end-of-call-report" && callLog?.transcript) {
        const { extractConversationInsights } = await import("@/modules/sales-crm/insights");
        await extractConversationInsights(
          callLog.id,
          callLog.transcript,
          callLog.summary || "",
        );
      }
    }

    if (type === "tool-calls") {
      const toolCalls = message.toolWithToolCallList || message.toolCalls || [];
      for (const tc of toolCalls) {
        const funcName = tc.function?.name || "";
        const args = tc.function?.arguments || {};
        await handleToolCall(funcName, args, organizationId, {
          voiceAgentId,
          providerCallId: event.providerCallId,
          callerNumber: getCallerNumber(message),
          providerAssistantId: event.providerAssistantId,
          providerPhoneNumberId: event.providerPhoneNumberId,
          toolCallId: tc.id || null,
          outcomeKey: `vapi:${event.providerCallId || event.id}:tool:${tc.id || funcName}`,
        });
      }
    }

    await prisma.voiceWebhookEvent.update({
      where: { id: eventId },
      data: {
        status: "processed",
        processedAt: new Date(),
        nextAttemptAt: null,
        errorMessage: null,
        lastErrorCode: null,
      },
    });
  } catch (error) {
    const errStr = error instanceof Error ? error.message : "Unknown error";
    const errorCode =
      error instanceof Error && "code" in error
        ? String((error as Error & { code?: string }).code || "PROCESSING_FAILED")
        : "PROCESSING_FAILED";
    await prisma.voiceWebhookEvent.update({
      where: { id: eventId },
      data: {
        status: errorCode === "TENANT_UNRESOLVED" ? "mapping_failed" : "failed",
        errorMessage: errStr,
        lastErrorCode: errorCode,
        retryCount: { increment: 1 },
        nextAttemptAt: new Date(Date.now() + 5 * 60_000),
      },
    });
    throw error;
  }
}

export async function scheduleRecurringVoiceJobs(now = new Date()) {
  const retentionBucket = now.toISOString().slice(0, 10);
  await enqueueVoiceJob({
    type: "apply_data_retention",
    payload: { scheduledFor: retentionBucket },
    idempotencyKey: `retention:${retentionBucket}`,
    correlationId: `data-retention:${retentionBucket}`,
    entityType: "DataRetentionWindow",
    entityId: retentionBucket,
  });

  if (!getVapiPrivateApiKey()) {
    return {
      scheduled: true,
      reconciliationScheduled: false,
      reason: "vapi_key_missing",
      retentionBucket,
    };
  }
  const intervalMinutes = Math.max(
    15,
    Number(process.env.VAPI_RECONCILIATION_INTERVAL_MINUTES || 60),
  );
  const bucket = Math.floor(now.getTime() / (intervalMinutes * 60_000));
  const from = new Date(now.getTime() - 6 * 60 * 60_000);
  await enqueueVoiceJob({
    type: "reconcile_vapi_calls",
    payload: {
      from: from.toISOString(),
      to: now.toISOString(),
      pageSize: 500,
      maxPages: 20,
    },
    idempotencyKey: `recent:${bucket}`,
    correlationId: `vapi-reconciliation:${bucket}`,
    entityType: "VapiReconciliationWindow",
    entityId: `${from.toISOString()}:${now.toISOString()}`,
  });
  return {
    scheduled: true,
    reconciliationScheduled: true,
    bucket,
    retentionBucket,
  };
}

export async function replayVapiWebhookEvent(eventId: string) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.voiceWebhookEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizationId: true,
        voiceAgentId: true,
        correlationId: true,
      },
    });
    if (!event) throw new Error("Vapi webhook event was not found.");

    await tx.voiceWebhookEvent.update({
      where: { id: event.id },
      data: {
        status: "received",
        errorMessage: null,
        lastErrorCode: null,
        processedAt: null,
        deadLetteredAt: null,
        nextAttemptAt: null,
      },
    });
    const job = await tx.voiceJob.upsert({
      where: {
        type_idempotencyKey: {
          type: "process_webhook_event",
          idempotencyKey: event.id,
        },
      },
      update: {
        status: "queued",
        organizationId: event.organizationId,
        voiceAgentId: event.voiceAgentId,
        attempts: 0,
        scheduledAt: new Date(),
        startedAt: null,
        completedAt: null,
        deadLetteredAt: null,
        failureCode: null,
        lastError: null,
        lockedAt: null,
        lockedBy: null,
        leaseExpiresAt: null,
      },
      create: {
        organizationId: event.organizationId,
        voiceAgentId: event.voiceAgentId,
        type: "process_webhook_event",
        status: "queued",
        idempotencyKey: event.id,
        correlationId: event.correlationId,
        entityType: "VoiceWebhookEvent",
        entityId: event.id,
        payloadJson: JSON.stringify({ eventId: event.id }),
      },
    });
    return { eventId: event.id, jobId: job.id };
  });
}

async function processWhatsAppNotificationJob(payload: any, jobOrganizationId?: string | null, jobVoiceAgentId?: string | null) {
  const { eventType, recipient, provider } = payload;
  
  if (!jobOrganizationId) throw new Error("Missing organizationId for WhatsApp notification");

  // Fetch settings to ensure notifications are enabled
  const integrationSettings = await prisma.voiceIntegrationSettings.findUnique({
    where: { organizationId: jobOrganizationId }
  });

  if (!integrationSettings?.whatsappNotificationsEnabled) {
    // If not enabled, we just log it as skipped
    await prisma.voiceNotificationLog.create({
      data: {
        organizationId: jobOrganizationId,
        voiceAgentId: jobVoiceAgentId,
        type: "whatsapp",
        eventType: eventType || "unknown",
        recipient: recipient || "unknown",
        status: "skipped",
        errorMessage: "WhatsApp notifications are disabled for this tenant.",
      }
    });
    return;
  }

  // Create a pending log entry
  const log = await prisma.voiceNotificationLog.create({
    data: {
      organizationId: jobOrganizationId,
      voiceAgentId: jobVoiceAgentId,
      type: "whatsapp",
      eventType: eventType || "unknown",
      recipient: recipient || "unknown",
      status: "queued",
      payloadJson: JSON.stringify(payload),
    }
  });

  try {
    // Actual provider logic would go here (e.g., Twilio, Meta Graph API)
    // For MVP, we simulate a successful dispatch
    // Simulating external API call...
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await prisma.voiceNotificationLog.update({
      where: { id: log.id },
      data: { status: "sent", provider: provider || "mock_provider" }
    });
  } catch (error) {
    const errStr = error instanceof Error ? error.message : "Unknown error";
    await prisma.voiceNotificationLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: errStr }
    });
    throw error; // Let the job queue retry it
  }
}
