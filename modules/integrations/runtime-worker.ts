import { prisma } from "@/lib/prisma";

import { getIntegrationProviderAdapter } from "./core/provider-adapters";
import { IntegrationError, toSafeIntegrationError } from "./core/errors";
import { integrationCredentialVault } from "./core/vault";
import {
  canClaimIntegrationEventWork,
  canClaimQueuedWork,
  computeNextRetryAt,
  shouldRetryIntegrationFailure,
} from "./core/workers";
import type {
  IntegrationEventRequest,
  IntegrationExecutionContext,
  IntegrationSyncRequest,
} from "./core/types";

const INTEGRATION_WORKER_LEASE_MS = 5 * 60_000;
const DEFAULT_EVENT_MAX_ATTEMPTS = 5;

function parseJsonArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject<T extends Record<string, unknown>>(value: string | null | undefined): T {
  if (!value) return {} as T;
  try {
    const parsed = JSON.parse(value) as T;
    return parsed && typeof parsed === "object" ? parsed : ({} as T);
  } catch {
    return {} as T;
  }
}

function getLeaseExpiry(now = new Date()) {
  return new Date(now.getTime() + INTEGRATION_WORKER_LEASE_MS);
}

function getSyncWorkerId() {
  return `integration-sync-worker-${process.pid}`;
}

function getEventWorkerId() {
  return `integration-event-worker-${process.pid}`;
}

async function buildExecutionContextFromIntegration(record: {
  id: string;
  organizationId: string;
  branchId: string | null;
  providerKey: string;
  encryptedCredentials: string | null;
  configuration: string | null;
  selectedResources: string | null;
}, input: {
  requestSource: IntegrationExecutionContext["requestSource"];
  correlationId: string;
}) {
  const credentials = record.encryptedCredentials
    ? await integrationCredentialVault.decrypt(record.encryptedCredentials)
    : {};

  return {
    tenantId: record.organizationId,
    branchId: record.branchId || undefined,
    tenantIntegrationId: record.id,
    providerKey: record.providerKey,
    correlationId: input.correlationId,
    requestSource: input.requestSource,
    credentials,
    configuration: parseJsonObject<Record<string, unknown>>(record.configuration),
    selectedResources: parseJsonArray<Record<string, unknown>>(record.selectedResources),
  } satisfies IntegrationExecutionContext;
}

function assertSyncDirection(value: string): IntegrationSyncRequest["direction"] {
  if (value === "inbound" || value === "outbound") {
    return value;
  }
  throw new IntegrationError("VALIDATION_FAILED", `Unsupported integration sync direction: ${value}`);
}

function parseEventPayload(payload: string): Record<string, unknown> {
  const parsed = parseJsonObject<Record<string, unknown>>(payload);
  return parsed;
}

async function claimDueIntegrationSyncJobs(limit: number, workerId: string, now = new Date()) {
  const due = await prisma.integrationSyncJob.findMany({
    where: {
      status: { in: ["queued", "retry_scheduled", "abandoned", "running"] },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    take: Math.max(limit * 3, limit),
  });

  const claimed = [];

  for (const job of due) {
    if (
      !canClaimQueuedWork({
        status: job.status,
        scheduledAt: job.scheduledAt,
        nextAttemptAt: job.nextAttemptAt,
        leaseExpiresAt: job.leaseExpiresAt,
        cancelledAt: job.cancelledAt,
        now,
      })
    ) {
      continue;
    }

    const result = await prisma.integrationSyncJob.updateMany({
      where: {
        id: job.id,
        status: job.status,
        leaseExpiresAt: job.status === "running" ? job.leaseExpiresAt : undefined,
      },
      data: {
        status: "running",
        startedAt: job.startedAt || now,
        heartbeatAt: now,
        leaseOwner: workerId,
        leaseExpiresAt: getLeaseExpiry(now),
        nextAttemptAt: null,
      },
    });

    if (result.count === 1) {
      claimed.push(job);
    }

    if (claimed.length >= limit) {
      break;
    }
  }

  return claimed;
}

async function claimDueIntegrationEvents(limit: number, workerId: string, now = new Date()) {
  const due = await prisma.integrationEvent.findMany({
    where: {
      status: { in: ["received", "failed", "processing"] },
    },
    orderBy: [{ receivedAt: "asc" }, { processedAt: "asc" }],
    take: Math.max(limit * 3, limit),
  });

  const claimed = [];

  for (const event of due) {
    if (
      !canClaimIntegrationEventWork({
        status: event.status,
        nextAttemptAt: event.nextAttemptAt,
        leaseExpiresAt: event.leaseExpiresAt,
        now,
      })
    ) {
      continue;
    }

    const result = await prisma.integrationEvent.updateMany({
      where: {
        id: event.id,
        status: event.status,
        leaseExpiresAt: event.status === "processing" ? event.leaseExpiresAt : undefined,
      },
      data: {
        status: "processing",
        leaseOwner: workerId,
        leaseExpiresAt: getLeaseExpiry(now),
        lastAttemptAt: now,
      },
    });

    if (result.count === 1) {
      claimed.push(event);
    }

    if (claimed.length >= limit) {
      break;
    }
  }

  return claimed;
}

export async function recoverAbandonedIntegrationSyncJobs(now = new Date()) {
  const stale = await prisma.integrationSyncJob.findMany({
    where: { status: "running" },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });

  let recovered = 0;

  for (const job of stale) {
    if (
      !canClaimQueuedWork({
        status: job.status,
        scheduledAt: job.scheduledAt,
        nextAttemptAt: job.nextAttemptAt,
        leaseExpiresAt: job.leaseExpiresAt,
        cancelledAt: job.cancelledAt,
        now,
      })
    ) {
      continue;
    }

    const nextAttemptAt = job.cancelRequestedAt ? null : now;
    const result = await prisma.integrationSyncJob.updateMany({
      where: {
        id: job.id,
        status: "running",
        leaseExpiresAt: job.leaseExpiresAt,
      },
      data: job.cancelRequestedAt
        ? {
            status: "cancelled",
            cancelledAt: now,
            leaseOwner: null,
            leaseExpiresAt: null,
            heartbeatAt: null,
          }
        : {
            status: "abandoned",
            leaseOwner: null,
            leaseExpiresAt: null,
            heartbeatAt: null,
            nextAttemptAt,
            errorCode: "WORKER_ABANDONED",
            errorSummary: "Recovered abandoned integration sync job after lease expiry.",
          },
    });

    recovered += result.count;
  }

  return { recovered };
}

export async function recoverAbandonedIntegrationEvents(now = new Date()) {
  const stale = await prisma.integrationEvent.findMany({
    where: { status: "processing" },
    orderBy: { receivedAt: "asc" },
    take: 100,
  });

  let recovered = 0;

  for (const event of stale) {
    if (
      !canClaimIntegrationEventWork({
        status: event.status,
        nextAttemptAt: event.nextAttemptAt,
        leaseExpiresAt: event.leaseExpiresAt,
        now,
      })
    ) {
      continue;
    }

    const result = await prisma.integrationEvent.updateMany({
      where: {
        id: event.id,
        status: "processing",
        leaseExpiresAt: event.leaseExpiresAt,
      },
      data: {
        status: "failed",
        leaseOwner: null,
        leaseExpiresAt: null,
        nextAttemptAt: now,
        errorCode: "WORKER_ABANDONED",
        processingNotes: "Recovered abandoned integration event after lease expiry.",
        lastAttemptAt: now,
      },
    });

    recovered += result.count;
  }

  return { recovered };
}

export async function processIntegrationSyncJobs(limit = 20) {
  const now = new Date();
  const workerId = getSyncWorkerId();
  await recoverAbandonedIntegrationSyncJobs(now);
  const claimed = await claimDueIntegrationSyncJobs(limit, workerId, now);

  let completed = 0;
  let partial = 0;
  let retried = 0;
  let failed = 0;

  for (const job of claimed) {
    const integration = await prisma.tenantIntegration.findUnique({
      where: { id: job.tenantIntegrationId },
      select: {
        id: true,
        organizationId: true,
        branchId: true,
        providerKey: true,
        encryptedCredentials: true,
        configuration: true,
        selectedResources: true,
      },
    });

    if (!integration) {
      await prisma.integrationSyncJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorCode: "INTEGRATION_NOT_FOUND",
          errorSummary: "Integration connection no longer exists.",
          heartbeatAt: null,
          leaseOwner: null,
          leaseExpiresAt: null,
        },
      });
      failed++;
      continue;
    }

    try {
      const context = await buildExecutionContextFromIntegration(integration, {
        requestSource: "worker",
        correlationId: `sync:${job.id}`,
      });
      const adapter = getIntegrationProviderAdapter(integration.providerKey);
      if (!adapter?.sync) {
        throw new IntegrationError("ACTION_NOT_SUPPORTED", `Provider does not support sync: ${integration.providerKey}`);
      }

      const result = await adapter.sync(context, {
        direction: assertSyncDirection(job.direction),
        entityType: job.entityType,
        cursor: job.cursor || undefined,
        dryRun: false,
      });

      if (!result.success) {
        throw new IntegrationError("PROVIDER_UNAVAILABLE", result.message, { statusCode: 503 });
      }

      const status = result.recordsFailed > 0 ? "partially_completed" : "completed";
      await prisma.integrationSyncJob.update({
        where: { id: job.id },
        data: {
          status,
          cursor: result.nextCursor || job.cursor,
          recordsProcessed: job.recordsProcessed + result.recordsProcessed,
          recordsSucceeded: job.recordsSucceeded + result.recordsSucceeded,
          recordsFailed: job.recordsFailed + result.recordsFailed,
          completedAt: new Date(),
          heartbeatAt: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          errorCode: null,
          errorSummary: result.message,
        },
      });

      await prisma.tenantIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSuccessfulAt: new Date(),
          healthStatus: result.recordsFailed > 0 ? "degraded" : "healthy",
          failureCount: result.recordsFailed > 0 ? { increment: 1 } : 0,
        },
      });

      if (status === "completed") {
        completed++;
      } else {
        partial++;
      }
    } catch (error) {
      const safe = toSafeIntegrationError(error);
      const nextAttempt = job.attemptCount + 1;
      const retryable = shouldRetryIntegrationFailure(safe.code);
      const willRetry = retryable && nextAttempt < job.maxAttempts;

      await prisma.integrationSyncJob.update({
        where: { id: job.id },
        data: {
          attemptCount: nextAttempt,
          status: willRetry ? "retry_scheduled" : "failed",
          nextAttemptAt: willRetry ? computeNextRetryAt({ attemptCount: nextAttempt, now }) : null,
          heartbeatAt: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          lastErrorAt: new Date(),
          errorCode: safe.code,
          errorSummary: safe.message,
        },
      });

      await prisma.tenantIntegration.updateMany({
        where: { id: job.tenantIntegrationId },
        data: {
          healthStatus: safe.code === "CREDENTIALS_EXPIRED" ? "expired" : "degraded",
          failureCount: { increment: 1 },
        },
      });

      if (willRetry) {
        retried++;
      } else {
        failed++;
      }
    }
  }

  return {
    claimed: claimed.length,
    completed,
    partial,
    retried,
    failed,
  };
}

export async function processIntegrationEvents(limit = 20) {
  const now = new Date();
  const workerId = getEventWorkerId();
  await recoverAbandonedIntegrationEvents(now);
  const claimed = await claimDueIntegrationEvents(limit, workerId, now);

  let processed = 0;
  let duplicates = 0;
  let retried = 0;
  let deadLettered = 0;

  for (const event of claimed) {
    const integration = await prisma.tenantIntegration.findUnique({
      where: { id: event.tenantIntegrationId },
      select: {
        id: true,
        organizationId: true,
        branchId: true,
        providerKey: true,
        encryptedCredentials: true,
        configuration: true,
        selectedResources: true,
      },
    });

    if (!integration) {
      await prisma.integrationEvent.update({
        where: { id: event.id },
        data: {
          status: "dead_lettered",
          deadLetteredAt: new Date(),
          errorCode: "INTEGRATION_NOT_FOUND",
          processingNotes: "Integration connection no longer exists.",
          leaseOwner: null,
          leaseExpiresAt: null,
        },
      });
      deadLettered++;
      continue;
    }

    try {
      const context = await buildExecutionContextFromIntegration(integration, {
        requestSource: "webhook",
        correlationId: `event:${event.id}`,
      });
      const adapter = getIntegrationProviderAdapter(integration.providerKey);
      if (!adapter?.handleEvent) {
        throw new IntegrationError("ACTION_NOT_SUPPORTED", `Provider does not support event handling: ${integration.providerKey}`);
      }

      const result = await adapter.handleEvent(context, {
        eventType: event.eventType,
        deduplicationKey: event.deduplicationKey,
        externalEventId: event.externalEventId || undefined,
        payload: parseEventPayload(event.payload),
      } satisfies IntegrationEventRequest);

      if (!result.success || result.status === "failed") {
        throw new IntegrationError(result.errorCode === "DUPLICATE_EVENT" ? "DUPLICATE_EVENT" : "PROVIDER_UNAVAILABLE", result.message, {
          statusCode: 503,
        });
      }

      await prisma.integrationEvent.update({
        where: { id: event.id },
        data: {
          status: result.status === "duplicate" ? "duplicate" : "processed",
          processedAt: new Date(),
          processingNotes: result.message,
          errorCode: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          nextAttemptAt: null,
          deadLetteredAt: null,
        },
      });

      if (result.status === "duplicate") {
        duplicates++;
      } else {
        processed++;
      }
    } catch (error) {
      const safe = toSafeIntegrationError(error);
      const nextAttempt = event.attemptCount + 1;
      const willRetry = shouldRetryIntegrationFailure(safe.code) && nextAttempt < DEFAULT_EVENT_MAX_ATTEMPTS;

      await prisma.integrationEvent.update({
        where: { id: event.id },
        data: {
          attemptCount: nextAttempt,
          status: willRetry ? "failed" : "dead_lettered",
          nextAttemptAt: willRetry ? computeNextRetryAt({ attemptCount: nextAttempt, now }) : null,
          deadLetteredAt: willRetry ? null : new Date(),
          processedAt: null,
          processingNotes: safe.message,
          errorCode: safe.code,
          leaseOwner: null,
          leaseExpiresAt: null,
          lastAttemptAt: new Date(),
        },
      });

      if (willRetry) {
        retried++;
      } else {
        deadLettered++;
      }
    }
  }

  return {
    claimed: claimed.length,
    processed,
    duplicates,
    retried,
    deadLettered,
  };
}
