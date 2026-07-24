import assert from "node:assert/strict";
import test from "node:test";

import { resolveDataRetentionPolicy } from "../../modules/security/data-retention";

test("data retention uses conservative defaults and rejects unsafe ranges", () => {
  assert.deepEqual(resolveDataRetentionPolicy({}), {
    recordingDays: 30,
    transcriptDays: 90,
    webhookPayloadDays: 30,
    messagingDays: 90,
  });

  assert.deepEqual(
    resolveDataRetentionPolicy({
      VOICE_RECORDING_RETENTION_DAYS: "0",
      VOICE_TRANSCRIPT_RETENTION_DAYS: "3651",
      VOICE_WEBHOOK_PAYLOAD_RETENTION_DAYS: "14",
      VOICE_MESSAGING_RETENTION_DAYS: "60",
    }),
    {
      recordingDays: 30,
      transcriptDays: 90,
      webhookPayloadDays: 14,
      messagingDays: 60,
    },
  );
});

