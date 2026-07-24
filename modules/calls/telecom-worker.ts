import { prisma } from "@/lib/prisma";
import { TelecomError } from "./errors";
import { cleanupExpiredTelecomWebhookNonces, reconcileStuckCalls } from "./maintenance";
import { logTelecomEvent } from "./observability";
import { runProviderHealthCheck } from "./provider-health";
import { processQueuedCallInitiation, processQueuedFallbackAttempt, saveProviderWebhook } from "./service";
import {
  TELECOM_JOB_TYPES,
  TELECOM_WORKER_VERSION,
  type TelecomJobType,
  enqueueTelecomJob,
  getLeaseExpiry,
  getTimeoutAt,
  isTelecomJobType,
  parseStoredTelecomJobPayload,
  sanitizeJobErrorMessage,
  shouldRecoverAbandonedJob,
} from "./telecom-jobs";

const RETRYABLE_ERROR_CODES = new Set<string>([
  "TEMPORARY_PROVIDER_FAILURE",
  "UNKNOWN_PROVIDER_CALL",
  "UNKNOWN_TENANT_MAPPING",
]);

export async function processTelecomJobs(limit = 20) {
  const workerId = `telecom-worker-${process.pid}`;
  await recoverAbandonedTelecomJobs();
  const claimed = await claimDueTelecomJobs(limit, workerId);

  if (claimed.length === 0) {
    return { processed: 0, successful: 0, failed: 0, deadLettered: 0 };
  }

  let successful = 0;
  let failed = 0;
  let deadLettered = 0;

  for (const job of claimed) {
    try {
      if (job.cancelRequestedAt) {
        await markJobCancelled(job.id, job.cancelReason || "Cancellation requested before execution.");
        continue;
      }

      const payload = parseStoredTelecomJobPayload(job.type as TelecomJobType, job.payloadJson);
      await runTelecomJob(job.type as TelecomJobType, {
        jobId: job.id,
        tenantId: job.organizationId,
        entityId: job.entityId,
        payload,
        correlationId: job.correlationId,
      });

      await prisma.voiceJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          failureCode: null,
          lastError: null,
          leaseExpiresAt: null,
          lastHeartbeatAt: null,
          timeoutAt: null,
        },
      });
      successful++;
    } catch (error) {
      const nextAttempt = job.attempts + 1;
      const retryable = shouldRetryTelecomJob(job.type, error);
      const willRetry = retryable && nextAttempt < job.maxAttempts;
      const errorMessage = error instanceof Error ? error.message : "Unknown telecom worker failure";
      const errorCode = error instanceof TelecomError ? error.code : "TELECOM_WORKER_FAILED";

      await prisma.voiceJob.update({
        where: { id: job.id },
        data: {
          attempts: nextAttempt,
          status: willRetry ? "retrying" : "failed",
          scheduledAt: willRetry ? computeRetryAt(nextAttempt) : job.scheduledAt,
          lastError: sanitizeJobErrorMessage(errorMessage),
          failureCode: errorCode,
          lockedAt: null,
          lockedBy: null,
          leaseExpiresAt: null,
          lastHeartbeatAt: null,
          timeoutAt: willRetry ? getTimeoutAt(computeRetryAt(nextAttempt)) : null,
          deadLetteredAt: willRetry ? null : new Date(),
        },
      });

      logTelecomEvent(willRetry ? "worker.job_retry_scheduled" : "worker.job_failed", {
        jobId: job.id,
        type: job.type,
        tenantId: job.organizationId,
        correlationId: job.correlationId,
        errorCode,
      });

      if (willRetry) {
        failed++;
      } else {
        failed++;
        deadLettered++;
      }
    }
  }

  return { processed: claimed.length, successful, failed, deadLettered };
}

export async function scheduleRecurringTelecomJobs(now = new Date()) {
  const scheduled: string[] = [];
  const healthBucket = createTimeBucket(now, 15 * 60_000);
  const housekeepingBucket = createTimeBucket(now, 60 * 60_000);

  const providers = await prisma.provider.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  for (const provider of providers) {
    const job = await enqueueTelecomJob({
      type: "TELECOM_PROVIDER_HEALTH_CHECK",
      idempotencyKey: `provider-health:${provider.id}:${healthBucket}`,
      providerId: provider.id,
      metadata: { providerId: provider.id },
      entityType: "Provider",
      entityId: provider.id,
      scheduledAt: now,
    });
    scheduled.push(job.id);
  }

  const reconcile = await enqueueTelecomJob({
    type: "TELECOM_RECONCILE_CALL",
    idempotencyKey: `reconcile:${housekeepingBucket}`,
    metadata: { limit: 50 },
    scheduledAt: now,
  });
  scheduled.push(reconcile.id);

  const cleanup = await enqueueTelecomJob({
    type: "TELECOM_WEBHOOK_NONCE_CLEANUP",
    idempotencyKey: `nonce-cleanup:${housekeepingBucket}`,
    metadata: { take: 1000 },
    scheduledAt: now,
  });
  scheduled.push(cleanup.id);

  return { scheduled: scheduled.length };
}

export function shouldRetryTelecomJob(type: string, error: unknown) {
  if (!isTelecomJobType(type)) return false;

  if (type === "TELECOM_INITIATE_PROVIDER_CALL" || type === "TELECOM_EVALUATE_FALLBACK") {
    // Provider invocation is side-effecting, so we fail closed instead of risking duplicate live attempts.
    return false;
  }

  if (error instanceof TelecomError) {
    return RETRYABLE_ERROR_CODES.has(error.code);
  }

  return true;
}

export function createTimeBucket(now: Date, windowMs: number) {
  return Math.floor(now.getTime() / windowMs).toString();
}

export async function retryTelecomJob(jobId: string) {
  const job = await prisma.voiceJob.findUnique({ where: { id: jobId } });
  if (!job || !isTelecomJobType(job.type)) {
    throw new TelecomError("UNKNOWN_PROVIDER_CALL", "Telecom job not found.", 404);
  }

  return prisma.voiceJob.update({
    where: { id: job.id },
    data: {
      status: "queued",
      attempts: 0,
      deadLetteredAt: null,
      failureCode: null,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      leaseExpiresAt: null,
      lastHeartbeatAt: null,
      cancelRequestedAt: null,
      cancelledAt: null,
      cancelReason: null,
      timeoutAt: getTimeoutAt(),
      scheduledAt: new Date(),
    },
  });
}

export async function cancelTelecomJob(jobId: string, reason = "Cancelled by operator.") {
  const job = await prisma.voiceJob.findUnique({ where: { id: jobId } });
  if (!job || !isTelecomJobType(job.type)) {
    throw new TelecomError("UNKNOWN_PROVIDER_CALL", "Telecom job not found.", 404);
  }

  if (job.status === "completed" || job.status === "cancelled") {
    return job;
  }

  if (job.status === "queued" || job.status === "retrying" || job.status === "failed") {
    return markJobCancelled(job.id, reason);
  }

  return prisma.voiceJob.update({
    where: { id: job.id },
    data: {
      cancelRequestedAt: new Date(),
      cancelReason: reason,
    },
  });
}

export async function listTelecomJobBacklog() {
  const [queued, retrying, processing, failed, cancelled] = await Promise.all([
    prisma.voiceJob.count({ where: { type: { in: [...TELECOM_JOB_TYPES] }, status: "queued" } }),
    prisma.voiceJob.count({ where: { type: { in: [...TELECOM_JOB_TYPES] }, status: "retrying" } }),
    prisma.voiceJob.count({ where: { type: { in: [...TELECOM_JOB_TYPES] }, status: "processing" } }),
    prisma.voiceJob.count({ where: { type: { in: [...TELECOM_JOB_TYPES] }, status: "failed" } }),
    prisma.voiceJob.count({ where: { type: { in: [...TELECOM_JOB_TYPES] }, status: "cancelled" } }),
  ]);

  return { queued, retrying, processing, failed, cancelled };
}

async function claimDueTelecomJobs(limit: number, workerId: string) {
  const due = await prisma.voiceJob.findMany({
    where: {
      type: { in: [...TELECOM_JOB_TYPES] },
      status: { in: ["queued", "retrying"] },
      scheduledAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  const claimed = [];
  for (const job of due) {
    const result = await prisma.voiceJob.updateMany({
      where: {
        id: job.id,
        status: { in: ["queued", "retrying"] },
      },
      data: {
        status: "processing",
        startedAt: job.startedAt || new Date(),
        lockedAt: new Date(),
        lockedBy: workerId,
        leaseExpiresAt: getLeaseExpiry(),
        lastHeartbeatAt: new Date(),
        timeoutAt: getTimeoutAt(job.startedAt || new Date()),
        workerVersion: TELECOM_WORKER_VERSION,
      },
    });

    if (result.count === 1) {
      claimed.push(job);
    }
  }

  return claimed;
}

async function runTelecomJob(
  type: TelecomJobType,
  input: {
    jobId: string;
    tenantId?: string | null;
    entityId?: string | null;
    correlationId?: string | null;
    payload: Record<string, unknown>;
  }
) {
  switch (type) {
    case "TELECOM_INITIATE_PROVIDER_CALL":
      await processQueuedCallInitiation({
        callId: stringOrNull(input.payload.callId) || input.entityId,
        attemptId: stringOrNull(input.payload.attemptId),
        tenantId: stringOrNull(input.payload.tenantId) || input.tenantId,
        correlationId: input.correlationId || null,
      });
      return;
    case "TELECOM_PROCESS_PROVIDER_EVENT":
      await saveProviderWebhook(
        requiredProviderType(input.payload.providerType),
        asRecord(input.payload.payload)
      );
      return;
    case "TELECOM_EVALUATE_FALLBACK":
      await processQueuedFallbackAttempt({
        callId: stringOrNull(input.payload.callId) || input.entityId,
        failedAttemptId: stringOrNull(input.payload.failedAttemptId),
        tenantId: stringOrNull(input.payload.tenantId) || input.tenantId,
        correlationId: input.correlationId || null,
      });
      return;
    case "TELECOM_RECONCILE_CALL":
      await reconcileStuckCalls({ limit: numberOrDefault(input.payload.limit, 50) });
      return;
    case "TELECOM_PROVIDER_HEALTH_CHECK":
      await runProviderHealthCheck(requiredString(input.payload.providerId, "providerId"));
      return;
    case "TELECOM_WEBHOOK_NONCE_CLEANUP":
      await cleanupExpiredTelecomWebhookNonces({ take: numberOrDefault(input.payload.take, 1000) });
      return;
    default:
      throw new TelecomError("TEMPORARY_PROVIDER_FAILURE", `Unsupported telecom worker job type: ${type}`, 400);
  }
}

function asRecord(value: unknown) {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  throw new TelecomError("UNKNOWN_PROVIDER_CALL", "Webhook payload was missing or invalid.", 400);
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function requiredString(value: unknown, field: string) {
  const parsed = stringOrNull(value);
  if (!parsed) {
    throw new TelecomError("TEMPORARY_PROVIDER_FAILURE", `Telecom worker payload is missing ${field}.`, 400);
  }
  return parsed;
}

function requiredProviderType(value: unknown): "twilio" | "asterisk" {
  if (value === "twilio" || value === "asterisk") {
    return value;
  }
  throw new TelecomError("UNKNOWN_PROVIDER_CALL", "Webhook provider type was invalid.", 400);
}

function numberOrDefault(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function computeRetryAt(nextAttempt: number) {
  return new Date(Date.now() + Math.min(30, Math.pow(2, nextAttempt)) * 60_000);
}

async function recoverAbandonedTelecomJobs(now = new Date()) {
  const abandoned = await prisma.voiceJob.findMany({
    where: {
      type: { in: [...TELECOM_JOB_TYPES] },
      status: "processing",
    },
    take: 100,
    orderBy: { updatedAt: "asc" },
  });

  for (const job of abandoned) {
    if (!shouldRecoverAbandonedJob({
      status: job.status,
      leaseExpiresAt: job.leaseExpiresAt,
      timeoutAt: job.timeoutAt,
      cancelRequestedAt: job.cancelRequestedAt,
      now,
    })) {
      continue;
    }

    if (job.cancelRequestedAt) {
      await markJobCancelled(job.id, job.cancelReason || "Cancellation requested while processing.");
      continue;
    }

    await prisma.voiceJob.update({
      where: { id: job.id },
      data: {
        status: "retrying",
        lockedAt: null,
        lockedBy: null,
        leaseExpiresAt: null,
        lastHeartbeatAt: null,
        scheduledAt: now,
        lastError: sanitizeJobErrorMessage(
          job.timeoutAt && job.timeoutAt.getTime() <= now.getTime()
            ? "Recovered abandoned telecom job after worker timeout."
            : "Recovered abandoned telecom job after lease expiry."
        ),
        failureCode: "TELECOM_JOB_ABANDONED",
      },
    });
  }
}

async function markJobCancelled(jobId: string, reason: string) {
  return prisma.voiceJob.update({
    where: { id: jobId },
    data: {
      status: "cancelled",
      cancelRequestedAt: null,
      cancelledAt: new Date(),
      cancelReason: reason,
      lockedAt: null,
      lockedBy: null,
      leaseExpiresAt: null,
      lastHeartbeatAt: null,
      timeoutAt: null,
    },
  });
}
