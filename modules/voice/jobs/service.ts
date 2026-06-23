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
          await processWhatsAppNotificationJob(payload, job.organizationId, job.voiceAgentId);
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
        voiceBusinessProfileId: event.voiceBusinessProfileId,
        voiceAgentId,
        message,
        callStatus: normalizeCallStatus(message.status),
      });
    }

    if (type === "end-of-call-report") {
      const callLog = await upsertCallLog({
        organizationId,
        voiceBusinessProfileId: event.voiceBusinessProfileId,
        voiceAgentId,
        message,
        callStatus: normalizeCallStatus(message.status || "completed"),
      });

      if (callLog && message.transcript) {
        const { extractConversationInsights } = require("@/modules/sales-crm/insights");
        await extractConversationInsights(callLog.id, message.transcript, message.summary || "");
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

async function processWhatsAppNotificationJob(payload: any, jobOrganizationId?: string | null, jobVoiceAgentId?: string | null) {
  const { eventType, recipient, content, provider } = payload;
  
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
    console.log(`[WhatsApp] Sending ${eventType} to ${recipient}...`);
    
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
