import assert from "node:assert/strict";
import test from "node:test";
import { TelecomError } from "@/modules/calls/errors";
import { isUncertainProviderInvocationError } from "@/modules/calls/failure";
import { createTimeBucket, shouldRetryTelecomJob } from "@/modules/calls/telecom-worker";
import {
  createProviderWebhookEventId,
  createTelecomJobIdempotencyKey,
  getLeaseExpiry,
  getTelecomJobMaxAttempts,
  getTimeoutAt,
  parseStoredTelecomJobPayload,
  parseTelecomJobPayload,
  sanitizeJobErrorMessage,
  shouldRecoverAbandonedJob,
} from "@/modules/calls/telecom-jobs";

test("telecom job idempotency keys include routing identity fields", () => {
  const key = createTelecomJobIdempotencyKey({
    type: "TELECOM_INITIATE_PROVIDER_CALL",
    idempotencyKey: "client-123",
    tenantId: "tenant-a",
    callId: "call-1",
    attemptId: "attempt-1",
    providerId: "provider-1",
  });

  assert.equal(
    key,
    "TELECOM_INITIATE_PROVIDER_CALL:tenant-a:call-1:attempt-1:provider-1:none:client-123"
  );
});

test("provider webhook event id prefers explicit provider event ids", () => {
  const id = createProviderWebhookEventId("twilio", { EventSid: "EV123" });
  assert.equal(id, "twilio:EV123");
});

test("provider webhook event id falls back to deterministic hashing", () => {
  const left = createProviderWebhookEventId("asterisk", { status: "ringing", uniqueid: "42" });
  const right = createProviderWebhookEventId("asterisk", { status: "ringing", uniqueid: "42" });
  assert.equal(left, right);
  assert.match(left, /^asterisk:/);
});

test("side-effecting telecom jobs do not retry after provider invocation errors", () => {
  const error = new TelecomError("TEMPORARY_PROVIDER_FAILURE", "provider timed out", 503);
  assert.equal(shouldRetryTelecomJob("TELECOM_INITIATE_PROVIDER_CALL", error), false);
  assert.equal(shouldRetryTelecomJob("TELECOM_EVALUATE_FALLBACK", error), false);
});

test("non-side-effecting telecom jobs may retry retryable telecom failures", () => {
  const error = new TelecomError("UNKNOWN_TENANT_MAPPING", "mapping unavailable", 404);
  assert.equal(shouldRetryTelecomJob("TELECOM_PROCESS_PROVIDER_EVENT", error), true);
  assert.equal(shouldRetryTelecomJob("TELECOM_PROVIDER_HEALTH_CHECK", new Error("network")), true);
});

test("telecom recurring scheduler uses stable time buckets", () => {
  const now = new Date("2026-07-10T10:07:30.000Z");
  assert.equal(createTimeBucket(now, 15 * 60_000), createTimeBucket(new Date("2026-07-10T10:14:59.000Z"), 15 * 60_000));
  assert.notEqual(createTimeBucket(now, 15 * 60_000), createTimeBucket(new Date("2026-07-10T10:15:00.000Z"), 15 * 60_000));
});

test("telecom job max attempts are conservative for side-effecting jobs", () => {
  assert.equal(getTelecomJobMaxAttempts("TELECOM_INITIATE_PROVIDER_CALL"), 1);
  assert.equal(getTelecomJobMaxAttempts("TELECOM_EVALUATE_FALLBACK"), 1);
  assert.equal(getTelecomJobMaxAttempts("TELECOM_PROCESS_PROVIDER_EVENT"), 5);
});

test("telecom job payloads are schema validated", () => {
  const payload = parseTelecomJobPayload("TELECOM_INITIATE_PROVIDER_CALL", {
    tenantId: "tenant-1",
    callId: "call-1",
    attemptId: "attempt-1",
  });

  assert.equal(payload.tenantId, "tenant-1");
  assert.throws(() => parseTelecomJobPayload("TELECOM_INITIATE_PROVIDER_CALL", { tenantId: "tenant-1" }));
});

test("stored telecom job payload envelopes are parsed safely", () => {
  const payload = parseStoredTelecomJobPayload(
    "TELECOM_PROCESS_PROVIDER_EVENT",
    JSON.stringify({
      version: 1,
      type: "TELECOM_PROCESS_PROVIDER_EVENT",
      data: { providerType: "twilio", payload: { CallSid: "CA123" } },
    })
  );

  if (!("providerType" in payload) || !("payload" in payload)) {
    assert.fail("Expected provider-event payload shape.");
  }

  assert.equal(payload.providerType, "twilio");
  assert.equal((payload.payload as Record<string, unknown>).CallSid, "CA123");
});

test("abandoned telecom jobs are recoverable after lease expiry or timeout", () => {
  const now = new Date("2026-07-10T12:00:00.000Z");
  assert.equal(
    shouldRecoverAbandonedJob({
      status: "processing",
      leaseExpiresAt: new Date("2026-07-10T11:59:59.000Z"),
      now,
    }),
    true
  );
  assert.equal(
    shouldRecoverAbandonedJob({
      status: "processing",
      timeoutAt: new Date("2026-07-10T11:59:59.000Z"),
      now,
    }),
    true
  );
  assert.equal(
    shouldRecoverAbandonedJob({
      status: "processing",
      leaseExpiresAt: new Date("2026-07-10T12:10:00.000Z"),
      timeoutAt: new Date("2026-07-10T12:10:00.000Z"),
      now,
    }),
    false
  );
});

test("lease and timeout helpers move forward from the provided time", () => {
  const now = new Date("2026-07-10T12:00:00.000Z");
  assert.ok(getLeaseExpiry(now).getTime() > now.getTime());
  assert.ok(getTimeoutAt(now).getTime() > now.getTime());
});

test("uncertain provider invocation errors are treated specially", () => {
  assert.equal(isUncertainProviderInvocationError(new Error("Provider request timed out")), true);
  assert.equal(isUncertainProviderInvocationError(new Error("Invalid destination number")), false);
});

test("job error messages are truncated for safe operator display", () => {
  const long = "x".repeat(1200);
  assert.equal(sanitizeJobErrorMessage(long).length, 1000);
});
