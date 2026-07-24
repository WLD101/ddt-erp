import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRateLimitBucketKey,
  enforceRateLimit,
  floorToWindow,
  type IntegrationRateLimitStore,
  type RateLimitCounterRecord,
} from "@/modules/integrations/core/rate-limit";

function createMemoryStore() {
  const records = new Map<string, RateLimitCounterRecord>();
  const store: IntegrationRateLimitStore = {
    async increment(input) {
      const current = records.get(input.bucketKey);
      const next: RateLimitCounterRecord = current
        ? { ...current, count: current.count + 1, windowEndsAt: input.windowEndsAt }
        : {
            bucketKey: input.bucketKey,
            count: 1,
            windowStartedAt: input.windowStartedAt,
            windowEndsAt: input.windowEndsAt,
          };
      records.set(input.bucketKey, next);
      return next;
    },
  };
  return { store, records };
}

test("bucket keys are stable inside the same window", () => {
  const windowStartedAt = floorToWindow(new Date("2026-07-22T12:34:56.000Z"), 60_000);
  const first = buildRateLimitBucketKey({
    organizationId: "org_1",
    providerKey: "google_workspace",
    tenantIntegrationId: "conn_1",
    actionKey: "calendar.create_event",
    windowStartedAt,
  });
  const second = buildRateLimitBucketKey({
    organizationId: "org_1",
    providerKey: "google_workspace",
    tenantIntegrationId: "conn_1",
    actionKey: "calendar.create_event",
    windowStartedAt,
  });
  assert.equal(first, second);
});

test("requests within policy are allowed", async () => {
  const { store } = createMemoryStore();
  const now = new Date("2026-07-22T12:00:00.000Z");

  await enforceRateLimit(store, {
    organizationId: "org_1",
    providerKey: "internal_test",
    tenantIntegrationId: "conn_1",
    actionKey: "internal_test.create_record",
    now,
    policy: { maxRequests: 2, windowMs: 60_000 },
  });

  await enforceRateLimit(store, {
    organizationId: "org_1",
    providerKey: "internal_test",
    tenantIntegrationId: "conn_1",
    actionKey: "internal_test.create_record",
    now,
    policy: { maxRequests: 2, windowMs: 60_000 },
  });
});

test("requests above policy are rate limited", async () => {
  const { store } = createMemoryStore();
  const now = new Date("2026-07-22T12:00:00.000Z");

  await enforceRateLimit(store, {
    organizationId: "org_1",
    providerKey: "internal_test",
    tenantIntegrationId: "conn_1",
    actionKey: "internal_test.create_record",
    now,
    policy: { maxRequests: 1, windowMs: 60_000 },
  });

  await assert.rejects(() =>
    enforceRateLimit(store, {
      organizationId: "org_1",
      providerKey: "internal_test",
      tenantIntegrationId: "conn_1",
      actionKey: "internal_test.create_record",
      now,
      policy: { maxRequests: 1, windowMs: 60_000 },
    })
  );
});
