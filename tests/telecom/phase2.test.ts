import assert from "node:assert/strict";
import test from "node:test";
import { maskPhoneNumber, maskSecret } from "@/modules/calls/masking";
import { isCallEligibleForReconciliation } from "@/modules/calls/maintenance";
import { isProviderHealthAcceptable } from "@/modules/calls/provider-health";

test("masks phone numbers for admin-safe display", () => {
  assert.equal(maskPhoneNumber("+923001234567"), "+92••••••4567");
  assert.equal(maskPhoneNumber("+14155552671"), "+14••••••2671");
  assert.equal(maskPhoneNumber(null), null);
});

test("masks secrets without exposing complete tokens", () => {
  assert.equal(maskSecret("abc123xyz"), "abc••••xyz");
  assert.equal(maskSecret("short"), "••••");
});

test("provider health accepts healthy and degraded providers only by default", () => {
  assert.equal(isProviderHealthAcceptable("HEALTHY"), true);
  assert.equal(isProviderHealthAcceptable("DEGRADED"), true);
  assert.equal(isProviderHealthAcceptable("UNHEALTHY"), false);
  assert.equal(isProviderHealthAcceptable("MAINTENANCE"), false);
  assert.equal(isProviderHealthAcceptable("DISABLED"), false);
});

test("emergency override allows routing through unhealthy provider", () => {
  assert.equal(isProviderHealthAcceptable("UNHEALTHY", true), true);
});

test("reconciliation eligibility ignores recent calls", () => {
  const now = new Date("2026-07-10T12:00:00.000Z");
  assert.equal(isCallEligibleForReconciliation("RINGING", new Date("2026-07-10T11:55:01.000Z"), now), false);
  assert.equal(isCallEligibleForReconciliation("RINGING", new Date("2026-07-10T11:49:00.000Z"), now), true);
  assert.equal(isCallEligibleForReconciliation("COMPLETED", new Date("2026-07-10T10:00:00.000Z"), now), false);
});
