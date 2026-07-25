export function computeBackoffDelayMs(attemptCount: number, baseMs = 30_000, maxMs = 15 * 60_000) {
  const exponent = Math.max(0, attemptCount - 1);
  return Math.min(baseMs * 2 ** exponent, maxMs);
}

export function computeNextRetryAt(input: {
  attemptCount: number;
  now?: Date;
  baseMs?: number;
  maxMs?: number;
}) {
  const now = input.now || new Date();
  const delay = computeBackoffDelayMs(input.attemptCount, input.baseMs, input.maxMs);
  return new Date(now.getTime() + delay);
}

export function leaseExpired(leaseExpiresAt?: Date | null, now = new Date()) {
  if (!leaseExpiresAt) return true;
  return leaseExpiresAt.getTime() <= now.getTime();
}

export function canClaimQueuedWork(input: {
  status: string;
  scheduledAt?: Date | null;
  nextAttemptAt?: Date | null;
  leaseExpiresAt?: Date | null;
  cancelledAt?: Date | null;
  now?: Date;
}) {
  const now = input.now || new Date();
  if (input.cancelledAt) return false;
  if (["completed", "cancelled", "dead_lettered"].includes(input.status)) return false;
  if (input.scheduledAt && input.scheduledAt.getTime() > now.getTime()) return false;
  if (input.nextAttemptAt && input.nextAttemptAt.getTime() > now.getTime()) return false;

  if (input.status === "queued" || input.status === "retry_scheduled" || input.status === "abandoned") {
    return true;
  }

  if (input.status === "running" || input.status === "processing") {
    return leaseExpired(input.leaseExpiresAt, now);
  }

  return false;
}

export function canClaimIntegrationEventWork(input: {
  status: string;
  nextAttemptAt?: Date | null;
  leaseExpiresAt?: Date | null;
  now?: Date;
}) {
  const now = input.now || new Date();

  if (["processed", "duplicate", "dead_lettered"].includes(input.status)) return false;
  if (input.nextAttemptAt && input.nextAttemptAt.getTime() > now.getTime()) return false;

  if (input.status === "received" || input.status === "failed") {
    return true;
  }

  if (input.status === "processing") {
    return leaseExpired(input.leaseExpiresAt, now);
  }

  return false;
}

export function shouldRetryIntegrationFailure(errorCode?: string | null) {
  return [
    "RATE_LIMITED",
    "PROVIDER_UNAVAILABLE",
    "TIMEOUT",
    "SYNC_CONFLICT",
    "RECONNECT_REQUIRED",
  ].includes(errorCode || "");
}
