import { prisma } from "@/lib/prisma";
import { canTransition, normalizeCallStatus, TERMINAL_CALL_STATUSES } from "./state-machine";

const DEFAULT_STUCK_MINUTES: Record<string, number> = {
  INITIATING: 10,
  QUEUED: 15,
  RINGING: 10,
  IN_PROGRESS: 180,
};

export async function reconcileStuckCalls(options: { limit?: number; now?: Date } = {}) {
  const now = options.now || new Date();
  const limit = options.limit ?? 50;
  const oldestThreshold = new Date(now.getTime() - Math.max(...Object.values(DEFAULT_STUCK_MINUTES)) * 60_000);

  const candidates = await prisma.call.findMany({
    where: {
      status: { in: Object.keys(DEFAULT_STUCK_MINUTES) },
      updatedAt: { lte: oldestThreshold },
    },
    include: {
      attempts: {
        orderBy: { attemptNumber: "desc" },
        take: 1,
        include: { provider: true },
      },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  let reconciled = 0;
  let skipped = 0;

  for (const call of candidates) {
    const thresholdMinutes = DEFAULT_STUCK_MINUTES[call.status] || 30;
    const eligibleAt = new Date(now.getTime() - thresholdMinutes * 60_000);
    if (call.updatedAt > eligibleAt || TERMINAL_CALL_STATUSES.has(normalizeCallStatus(call.status))) {
      skipped++;
      continue;
    }

    const attempt = call.attempts[0];
    if (!attempt) {
      skipped++;
      continue;
    }

    const nextStatus = "FAILED";
    if (!canTransition(call.status, nextStatus)) {
      skipped++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.callEvent.create({
        data: {
          tenantId: call.tenantId,
          callId: call.id,
          callAttemptId: attempt.id,
          provider: attempt.provider.type,
          providerEventId: `reconcile:${call.id}:${now.toISOString()}`,
          normalizedStatus: nextStatus,
          eventType: "reconciliation_timeout",
          rawPayload: JSON.stringify({ previousStatus: call.status, thresholdMinutes }),
          occurredAt: now,
          processedAt: now,
        },
      });

      await tx.call.update({
        where: { id: call.id },
        data: {
          status: nextStatus,
          failureClass: "TEMPORARY_PROVIDER_FAILURE",
          failureCode: "RECONCILIATION_TIMEOUT",
          failureMessage: "Call was reconciled after remaining in a non-terminal state beyond the safe threshold.",
        },
      });

      await tx.callAttempt.update({
        where: { id: attempt.id },
        data: {
          status: nextStatus,
          failureClass: "TEMPORARY_PROVIDER_FAILURE",
          failureCode: "RECONCILIATION_TIMEOUT",
          failureMessage: "Attempt was reconciled after timeout.",
          endedAt: now,
        },
      });
    });

    reconciled++;
  }

  return { scanned: candidates.length, reconciled, skipped };
}

export async function cleanupExpiredTelecomWebhookNonces(options: { now?: Date; take?: number } = {}) {
  const now = options.now || new Date();
  const take = options.take ?? 1000;
  const expired = await prisma.telecomWebhookNonce.findMany({
    where: { expiresAt: { lt: now } },
    select: { id: true },
    take,
    orderBy: { expiresAt: "asc" },
  });
  if (expired.length === 0) return { deleted: 0 };

  const result = await prisma.telecomWebhookNonce.deleteMany({
    where: { id: { in: expired.map((row) => row.id) } },
  });

  return { deleted: result.count };
}

export function isCallEligibleForReconciliation(status: string, updatedAt: Date, now = new Date()) {
  const normalized = normalizeCallStatus(status);
  const threshold = DEFAULT_STUCK_MINUTES[normalized];
  if (!threshold) return false;
  return updatedAt.getTime() <= now.getTime() - threshold * 60_000;
}
