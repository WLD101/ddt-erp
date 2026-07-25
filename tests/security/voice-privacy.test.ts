import assert from "node:assert/strict";
import test from "node:test";

import {
  applyVoicePrivacyToVapiPayload,
  defaultVoicePrivacyPolicy,
  resolveRecordingDisclosure,
} from "../../modules/voice/privacy/service";
import { buildVapiAssistantPayload } from "../../modules/voice/vapi/service";

function policy(overrides: Record<string, unknown> = {}) {
  return {
    ...defaultVoicePrivacyPolicy("tenant-a"),
    ...overrides,
  };
}

test("recording artifacts are removed until provider consent is granted", () => {
  const result = applyVoicePrivacyToVapiPayload(
    {
      type: "end-of-call-report",
      recordingUrl: "https://recordings.example/call.wav",
      artifact: {
        recording: {
          url: "https://recordings.example/call.wav",
        },
      },
      compliance: {
        recordingConsent: {
          type: "verbal",
        },
      },
    },
    policy({
      recordingEnabled: true,
      recordingDisclosureEnabled: true,
    }),
  );

  assert.equal(result.disclosure.status, "declined");
  assert.equal(result.disclosure.recordingAllowed, false);
  assert.equal("recordingUrl" in (result.payload as Record<string, unknown>), false);
  assert.deepEqual(
    (result.payload as { artifact: Record<string, unknown> }).artifact,
    {},
  );
});

test("provider consent evidence permits the configured recording artifact", () => {
  const grantedAt = "2026-07-24T10:00:00.000Z";
  const payload = {
    type: "end-of-call-report",
    recordingUrl: "https://recordings.example/call.wav",
    compliance: {
      recordingConsent: {
        type: "verbal",
        grantedAt,
      },
    },
  };
  const disclosure = resolveRecordingDisclosure(
    payload,
    policy({
      recordingEnabled: true,
      recordingDisclosureEnabled: true,
    }),
  );
  const result = applyVoicePrivacyToVapiPayload(
    payload,
    policy({
      recordingEnabled: true,
      recordingDisclosureEnabled: true,
    }),
  );

  assert.equal(disclosure.status, "completed");
  assert.equal(disclosure.completedAt?.toISOString(), grantedAt);
  assert.equal(
    (result.payload as Record<string, unknown>).recordingUrl,
    payload.recordingUrl,
  );
});

test("transcript content is stripped when tenant transcription is disabled", () => {
  const result = applyVoicePrivacyToVapiPayload(
    {
      type: "end-of-call-report",
      transcript: "Sensitive caller content",
      artifact: {
        transcript: "Sensitive caller content",
        messages: [{ role: "user", message: "Sensitive caller content" }],
      },
    },
    policy({
      transcriptionEnabled: false,
    }),
  );
  const sanitized = result.payload as {
    transcript?: unknown;
    artifact: {
      transcript?: unknown;
      messages?: unknown;
    };
  };

  assert.equal("transcript" in sanitized, false);
  assert.equal("transcript" in sanitized.artifact, false);
  assert.equal("messages" in sanitized.artifact, false);
});

test("Vapi assistant payload uses artifact and consent plans", () => {
  const previousCredential = process.env.VAPI_SERVER_CREDENTIAL_ID;
  process.env.VAPI_SERVER_CREDENTIAL_ID = "credential-test-id";
  try {
    const payload = buildVapiAssistantPayload({
      assistantName: "Tenant A Receptionist",
      firstMessage: "Thanks for calling Tenant A.",
      prompt: "Tenant-scoped prompt.",
      webhookUrl: "https://voice.example.test/api/webhooks/vapi",
      toolNames: [],
      recordingEnabled: true,
      recordingDisclosureEnabled: true,
      recordingDisclosureType: "verbal",
      recordingDisclosureText:
        "This call may be recorded. Do you agree to continue?",
      transcriptionEnabled: true,
      countryCode: "GB",
      languageMode: "ENGLISH",
      voiceId: "79a125e8-cd45-4c13-8a67-188112f4dd22",
    }) as {
      server: { credentialId?: string; secret?: string };
      artifactPlan: {
        recordingEnabled: boolean;
        transcriptPlan: { enabled: boolean };
      };
      compliancePlan: {
        recordingConsentPlan: { type: string };
      };
    };

    assert.equal(payload.server.credentialId, "credential-test-id");
    assert.equal(payload.server.secret, undefined);
    assert.equal(payload.artifactPlan.recordingEnabled, true);
    assert.equal(payload.artifactPlan.transcriptPlan.enabled, true);
    assert.equal(
      payload.compliancePlan.recordingConsentPlan.type,
      "verbal",
    );
  } finally {
    if (previousCredential === undefined) {
      delete process.env.VAPI_SERVER_CREDENTIAL_ID;
    } else {
      process.env.VAPI_SERVER_CREDENTIAL_ID = previousCredential;
    }
  }
});
