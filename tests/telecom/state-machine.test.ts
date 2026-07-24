import assert from "node:assert/strict";
import test from "node:test";
import { assertValidTransition, canTransition, normalizeCallStatus } from "@/modules/calls/state-machine";

test("allows valid call transitions", () => {
  assert.doesNotThrow(() => assertValidTransition("CREATED", "ROUTING"));
  assert.doesNotThrow(() => assertValidTransition("ROUTING", "INITIATING"));
  assert.doesNotThrow(() => assertValidTransition("RINGING", "IN_PROGRESS"));
  assert.doesNotThrow(() => assertValidTransition("IN_PROGRESS", "COMPLETED"));
});

test("prevents terminal calls from moving backwards", () => {
  assert.equal(canTransition("COMPLETED", "RINGING"), false);
  assert.throws(() => assertValidTransition("FAILED", "IN_PROGRESS"));
});

test("normalizes provider statuses", () => {
  assert.equal(normalizeCallStatus("in-progress"), "IN_PROGRESS");
  assert.equal(normalizeCallStatus("no-answer"), "NO_ANSWER");
  assert.equal(normalizeCallStatus("dry_run"), "QUEUED");
});
