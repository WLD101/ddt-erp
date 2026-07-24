import assert from "node:assert/strict";
import test from "node:test";

import { canClaimQueuedWork, computeBackoffDelayMs, computeNextRetryAt, leaseExpired } from "@/modules/integrations/core/workers";

test("backoff grows exponentially and caps", () => {
  assert.equal(computeBackoffDelayMs(1, 1000, 8000), 1000);
  assert.equal(computeBackoffDelayMs(2, 1000, 8000), 2000);
  assert.equal(computeBackoffDelayMs(5, 1000, 8000), 8000);
});

test("lease expiry detects stale workers", () => {
  const now = new Date("2026-07-22T12:00:00.000Z");
  assert.equal(leaseExpired(new Date("2026-07-22T11:59:00.000Z"), now), true);
  assert.equal(leaseExpired(new Date("2026-07-22T12:01:00.000Z"), now), false);
});

test("queued and abandoned work can be claimed when due", () => {
  const now = new Date("2026-07-22T12:00:00.000Z");
  assert.equal(canClaimQueuedWork({ status: "queued", scheduledAt: now, now }), true);
  assert.equal(canClaimQueuedWork({ status: "abandoned", scheduledAt: now, now }), true);
  assert.equal(canClaimQueuedWork({ status: "running", leaseExpiresAt: new Date("2026-07-22T11:59:00.000Z"), now }), true);
  assert.equal(canClaimQueuedWork({ status: "completed", now }), false);
});

test("next retry uses current backoff schedule", () => {
  const now = new Date("2026-07-22T12:00:00.000Z");
  const next = computeNextRetryAt({ attemptCount: 3, now, baseMs: 1000, maxMs: 10_000 });
  assert.equal(next.toISOString(), "2026-07-22T12:00:04.000Z");
});
