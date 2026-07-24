import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVapiDeduplicationKey,
  decryptVapiPayload,
  encryptVapiPayload,
  hashVapiPayload,
  redactVapiPayload,
} from "@/modules/voice/vapi/event-security";
import { normalizeVapiCall } from "@/modules/voice/vapi/call-lifecycle";
import { summarizeVoiceCallMetrics } from "@/modules/voice/vapi/metrics";
import { compareVapiCallWithLedger } from "@/modules/voice/vapi/reconciliation";

function callMessage(overrides: Record<string, unknown> = {}) {
  return {
    type: "end-of-call-report",
    status: "ended",
    endedReason: "customer-ended-call",
    artifact: { transcript: "Assistant: Hello. User: I need help." },
    call: {
      id: "call-1",
      type: "inboundPhoneCall",
      startedAt: "2026-07-23T10:00:00.000Z",
      endedAt: "2026-07-23T10:02:00.000Z",
      cost: 0.18,
    },
    ...overrides,
  };
}

function metricRecord(normalized: NonNullable<ReturnType<typeof normalizeVapiCall>>) {
  return {
    callDirection: normalized.direction,
    conversationDurationSeconds: normalized.conversationDurationSeconds,
    billableDurationSeconds: normalized.billableDurationSeconds,
    providerActualCostUsd: normalized.providerActualCostUsd,
    customerBillableCost: null,
    isAnswered: normalized.isAnswered,
    isCompleted: normalized.isCompleted,
    isMissed: normalized.isMissed,
    isFailed: normalized.isFailed,
    isTransferred: normalized.isTransferred,
    isVoicemail: normalized.isVoicemail,
    isQualified: normalized.isQualified,
    isResolved: normalized.isResolved,
    requiresFollowUp: normalized.requiresFollowUp,
  };
}

test("counts an inbound answered call once as answered and completed", () => {
  const normalized = normalizeVapiCall({ message: callMessage() });
  assert.ok(normalized);
  const metrics = summarizeVoiceCallMetrics([metricRecord(normalized)]);
  assert.deepEqual(
    {
      total: metrics.totalCalls,
      inbound: metrics.inboundCalls,
      answered: metrics.answeredCalls,
      completed: metrics.completedCalls,
      missed: metrics.missedCalls,
    },
    { total: 1, inbound: 1, answered: 1, completed: 1, missed: 0 },
  );
});

test("classifies inbound no-answer without marking it answered", () => {
  const normalized = normalizeVapiCall({
    message: callMessage({
      endedReason: "customer-did-not-answer",
      artifact: {},
      call: {
        id: "call-no-answer",
        type: "inboundPhoneCall",
        startedAt: "2026-07-23T10:00:00.000Z",
        endedAt: "2026-07-23T10:00:20.000Z",
      },
    }),
  });
  assert.ok(normalized);
  assert.equal(normalized.status, "NO_ANSWER");
  assert.equal(normalized.isAnswered, false);
  assert.equal(normalized.isMissed, true);
  assert.equal(normalized.isFailed, false);
});

test("allows an inbound technical failure to be both missed and failed", () => {
  const normalized = normalizeVapiCall({
    message: callMessage({
      endedReason: "call.in-progress.error-vapifault-transport-never-connected",
      artifact: {},
      call: { id: "call-provider-failure", type: "inboundPhoneCall" },
    }),
  });
  assert.ok(normalized);
  assert.equal(normalized.status, "PROVIDER_ERROR");
  assert.equal(normalized.isAnswered, false);
  assert.equal(normalized.isMissed, true);
  assert.equal(normalized.isFailed, true);
});

test("separates outbound answered and outbound failed calls", () => {
  const answered = normalizeVapiCall({
    message: callMessage({
      call: {
        id: "call-outbound-ok",
        type: "outboundPhoneCall",
        startedAt: "2026-07-23T10:00:00.000Z",
        endedAt: "2026-07-23T10:01:00.000Z",
      },
    }),
  });
  const failed = normalizeVapiCall({
    message: callMessage({
      endedReason: "call.start.error-provider",
      artifact: {},
      call: { id: "call-outbound-failed", type: "outboundPhoneCall" },
    }),
  });
  assert.ok(answered && failed);
  const metrics = summarizeVoiceCallMetrics([metricRecord(answered), metricRecord(failed)]);
  assert.equal(metrics.outboundCalls, 2);
  assert.equal(metrics.answeredCalls, 1);
  assert.equal(metrics.completedCalls, 1);
  assert.equal(metrics.failedCalls, 1);
  assert.equal(metrics.missedCalls, 0);
});

test("tracks successful and failed transfers as separate dimensions", () => {
  const connected = normalizeVapiCall({
    message: {
      type: "transfer-update",
      status: "connected",
      call: { id: "call-transfer-ok", type: "inboundPhoneCall" },
      destination: { type: "number" },
    },
  });
  const failed = normalizeVapiCall({
    message: {
      type: "transfer-update",
      status: "failed",
      call: { id: "call-transfer-failed", type: "inboundPhoneCall" },
      destination: { type: "number" },
    },
  });
  assert.ok(connected && failed);
  assert.equal(connected.transferRequested, true);
  assert.equal(connected.transferConnected, true);
  assert.equal(connected.isTransferred, true);
  assert.equal(failed.transferRequested, true);
  assert.equal(failed.transferFailed, true);
  assert.equal(failed.isTransferred, false);
});

test("uses a deterministic deduplication identity for duplicate webhook payloads", () => {
  const payload = callMessage();
  const firstHash = hashVapiPayload(payload);
  const secondHash = hashVapiPayload(JSON.parse(JSON.stringify(payload)));
  assert.equal(firstHash, secondHash);
  assert.equal(
    buildVapiDeduplicationKey({
      providerCallId: "call-1",
      eventType: "end-of-call-report",
      payloadHash: firstHash,
    }),
    buildVapiDeduplicationKey({
      providerCallId: "call-1",
      eventType: "end-of-call-report",
      payloadHash: secondHash,
    }),
  );
});

test("keeps one call identity when post-call analysis arrives later", () => {
  const inProgress = normalizeVapiCall({
    message: {
      type: "status-update",
      status: "in-progress",
      call: { id: "call-late-analysis", type: "inboundPhoneCall" },
    },
    eventReceivedAt: new Date("2026-07-23T10:00:00.000Z"),
  });
  assert.ok(inProgress);
  const withAnalysis = normalizeVapiCall({
    message: {
      type: "end-of-call-report",
      status: "ended",
      call: { id: "call-late-analysis", type: "inboundPhoneCall" },
      analysis: { summary: "Customer requested a callback.", structuredData: { outcome: "follow_up_required" } },
    },
    existing: {
      callStatus: inProgress.status,
      callDirection: inProgress.direction,
      isAnswered: inProgress.isAnswered,
      answeredAt: inProgress.answeredAt,
    },
  });
  assert.ok(withAnalysis);
  assert.equal(withAnalysis.externalCallKey, inProgress.externalCallKey);
  assert.equal(withAnalysis.analysisStatus, "ready");
  assert.equal(withAnalysis.requiresFollowUp, true);
});

test("keeps ring, conversation, total, and billable duration distinct", () => {
  const normalized = normalizeVapiCall({
    message: {
      type: "end-of-call-report",
      status: "ended",
      call: {
        id: "call-duration",
        type: "inboundPhoneCall",
        startedAt: "2026-07-23T10:00:00.000Z",
        answeredAt: "2026-07-23T10:00:10.000Z",
        endedAt: "2026-07-23T10:01:10.000Z",
        billableDurationSeconds: 60,
      },
    },
  });
  assert.ok(normalized);
  assert.equal(normalized.ringDurationSeconds, 10);
  assert.equal(normalized.conversationDurationSeconds, 60);
  assert.equal(normalized.totalDurationSeconds, 70);
  assert.equal(normalized.billableDurationSeconds, 60);
});

test("redacts diagnostics while retaining an encrypted replay payload", () => {
  const previous = process.env.VAPI_EVENT_ENCRYPTION_KEY;
  process.env.VAPI_EVENT_ENCRYPTION_KEY = "test-only-vapi-event-key";
  try {
    const payload = {
      type: "tool-calls",
      transcript: "private conversation",
      customer: { number: "+441234567890", email: "person@example.com" },
      toolCalls: [{ id: "tool-1", function: { name: "capture_lead", arguments: { name: "Person" } } }],
    };
    const redacted = redactVapiPayload(payload) as any;
    assert.equal(redacted.transcript, "[REDACTED_TRANSCRIPT]");
    assert.equal(redacted.customer.number, "[REDACTED_PHONE:7890]");
    assert.equal(redacted.toolCalls[0].function.arguments, "[ENCRYPTED_TOOL_ARGUMENTS]");
    const encrypted = encryptVapiPayload(payload);
    assert.ok(encrypted);
    assert.deepEqual(decryptVapiPayload(encrypted), payload);
  } finally {
    if (previous === undefined) delete process.env.VAPI_EVENT_ENCRYPTION_KEY;
    else process.env.VAPI_EVENT_ENCRYPTION_KEY = previous;
  }
});

test("detects missing local calls and provider field mismatches", () => {
  const provider = callMessage().call as Record<string, any>;
  assert.deepEqual(compareVapiCallWithLedger(provider, null), ["missing_local_record"]);
  const issues = compareVapiCallWithLedger(provider, {
    callStatus: "FAILED",
    totalDurationSeconds: 5,
    durationSeconds: 5,
    providerActualCostUsd: 0.01,
    costUsd: 0.01,
    analysisStatus: "ready",
  });
  assert.ok(issues.includes("status_mismatch"));
  assert.ok(issues.includes("duration_mismatch"));
  assert.ok(issues.includes("cost_mismatch"));
});
