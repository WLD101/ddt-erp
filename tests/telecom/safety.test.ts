import assert from "node:assert/strict";
import test from "node:test";
import { classifyProviderFailure, isFallbackEligible } from "@/modules/calls/failure";
import { createDeterministicEventId, createRequestFingerprint } from "@/modules/calls/idempotency";
import { createAsteriskWebhookSignature } from "@/modules/calls/webhook-security";

test("request fingerprints are stable regardless of object key order", () => {
  const first = createRequestFingerprint({ to: "+923001234567", metadata: { b: 2, a: 1 } });
  const second = createRequestFingerprint({ metadata: { a: 1, b: 2 }, to: "+923001234567" });
  assert.equal(first, second);
});

test("deterministic provider event ids are stable", () => {
  const first = createDeterministicEventId("twilio", { CallSid: "CA123", CallStatus: "completed", SequenceNumber: "7" });
  const second = createDeterministicEventId("twilio", { SequenceNumber: "7", CallStatus: "completed", CallSid: "CA123" });
  assert.equal(first, second);
});

test("classifies fallback eligible provider failures", () => {
  const failure = classifyProviderFailure(new Error("temporary provider unavailable"));
  assert.equal(failure, "TEMPORARY_PROVIDER_FAILURE");
  assert.equal(isFallbackEligible(failure), true);
});

test("does not fallback for policy rejection", () => {
  const failure = classifyProviderFailure(new Error("destination blocked by policy"));
  assert.equal(failure, "POLICY_REJECTION");
  assert.equal(isFallbackEligible(failure), false);
});

test("creates expected Asterisk HMAC signature", () => {
  const material = ["POST", "/api/calls/provider-webhook/asterisk", "1770000000", "nonce-1", "{\"callId\":\"abc\"}"].join("\n");
  const signature = createAsteriskWebhookSignature("secret", material);
  assert.equal(signature.length, 64);
  assert.notEqual(signature, createAsteriskWebhookSignature("other-secret", material));
});
