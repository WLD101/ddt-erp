import { prisma } from "@/lib/prisma";
import { normalizeCallStatus, isMissedStatus, getCallerNumber, touchIntegrationWebhook, upsertCallLog } from "@/modules/voice/vapi/webhook-helpers";
import { resolveVoiceAgentForWebhook } from "@/modules/voice/agents/service";
import { handleToolCall } from "@/modules/voice/vapi/tools";

export async function enqueueVoiceJob({
  organizationId,
  voiceAgentId,
  type,
  payload,
  scheduledAt,
}: {
  organizationId?: string | null;
  voiceAgentId?: string | null;
  type: string;
  payload: unknown;
  scheduledAt?: Date;
}) {
  return prisma.voiceJob.create({
    data: {
      organizationId: organizationId || null,
      voiceAgentId: voiceAgentId || null,
      type,
      payloadJson: JSON.stringify(payload),
      scheduledAt: scheduledAt || new Date(),
    },
  });
}

export async function processVoiceJobs(limit = 10) {
  const jobs = await prisma.voiceJob.findMany({
    where: {
      status: { in: ["queued", "retrying"] },
      scheduledAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  if (jobs.length === 0) return { processed: 0, successful: 0, failed: 0 };

  let successful = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await prisma.voiceJob.update({
        where: { id: job.id },
        data: { status: "processing", startedAt: new Date() },
      });

      const payload = job.payloadJson ? JSON.parse(job.payloadJson) : {};

      switch (job.type) {
        case "process_webhook_event":
          await processWebhookEventJob(payload, job.organizationId, job.voiceAgentId);
          break;
        case "sync_vapi_agent":
          // Placeholder for async syncing
          console.log("[Job] Skipping unimplemented sync_vapi_agent");
          break;
        case "send_whatsapp_notification":
          // Placeholder for WhatsApp queue
          console.log("[Job] Skipping unimplemented send_whatsapp_notification");
          break;
        default:
          console.warn(`[Job] Unknown job type: ${job.type}`);
      }

      await prisma.voiceJob.update({
        where: { id: job.id },
        data: { status: "completed", completedAt: new Date() },
      });
      successful++;
    } catch (error) {
      console.error(`[Job] Failed to process job ${job.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const nextAttempt = job.attempts + 1;
      const willRetry = nextAttempt < job.maxAttempts;

      await prisma.voiceJob.update({
        where: { id: job.id },
        data: {
          status: willRetry ? "retrying" : "failed",
          attempts: nextAttempt,
          lastError: errorMessage,
          scheduledAt: willRetry ? new Date(Date.now() + Math.pow(2, nextAttempt) * 60000) : job.scheduledAt,
        },
      });
      failed++;
    }
  }

  return { processed: jobs.length, successful, failed };
}

async function processWebhookEventJob(payload: any, jobOrganizationId?: string | null, jobVoiceAgentId?: string | null) {
  const eventId = payload.eventId;
  if (!eventId) throw new Error("Missing eventId in process_webhook_event payload");

  const event = await prisma.voiceWebhookEvent.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "received") return;

  await prisma.voiceWebhookEvent.update({
    where: { id: eventId },
    data: { status: "processing" },
  });

  try {
    const message = event.rawPayloadJson ? JSON.parse(event.rawPayloadJson) : {};
    const type = event.eventType;
    
    // We already have organizationId from mapping if it succeeded
    if (!event.organizationId) {
      await prisma.voiceWebhookEvent.update({
        where: { id: eventId },
        data: { status: "mapping_failed", processedAt: new Date() },
      });
      return;
    }

    const organizationId = event.organizationId;
    const voiceAgentId = event.voiceAgentId;

    await touchIntegrationWebhook(organizationId, type, event.providerAssistantId);

    if (type === "status-update") {
      await upsertCallLog({
        organizationId,
        voiceAgentId,
        message,
        callStatus: normalizeCallStatus(message.status),
      });
    }

    if (type === "end-of-call-report") {
      await upsertCallLog({
        organizationId,
        voiceAgentId,
        message,
        callStatus: normalizeCallStatus(message.status || "completed"),
      });
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
        });
      }
    }

    await prisma.voiceWebhookEvent.update({
      where: { id: eventId },
      data: { status: "processed", processedAt: new Date() },
    });
  } catch (error) {
    const errStr = error instanceof Error ? error.message : "Unknown error";
    await prisma.voiceWebhookEvent.update({
      where: { id: eventId },
      data: { status: "failed", errorMessage: errStr, processedAt: new Date() },
    });
    throw error;
  }
}
