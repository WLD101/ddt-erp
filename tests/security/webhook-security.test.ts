import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  readBoundedText,
  RequestBodyTooLargeError,
} from "../../lib/security/request-body";
import { verifySha256HmacSignature } from "../../lib/security/webhook-signatures";
import { isFreshWebhookTimestamp } from "../../lib/security/webhook-timestamp";

test("WhatsApp-style SHA-256 signatures validate", () => {
  const body = JSON.stringify({ object: "whatsapp_business_account" });
  const secret = "test-app-secret";
  const signature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")}`;

  assert.equal(
    verifySha256HmacSignature({ body, signature, secret }),
    true,
  );
  assert.equal(
    verifySha256HmacSignature({ body: `${body}x`, signature, secret }),
    false,
  );
  assert.equal(
    verifySha256HmacSignature({ body, signature: signature.slice(7), secret }),
    false,
  );
});

test("bounded webhook bodies reject declared and actual oversized payloads", async () => {
  await assert.rejects(
    () => readBoundedText(
      new Request("https://example.test/webhook", {
        method: "POST",
        headers: { "content-length": "11" },
        body: "short",
      }),
      10,
    ),
    RequestBodyTooLargeError,
  );

  await assert.rejects(
    () => readBoundedText(
      new Request("https://example.test/webhook", {
        method: "POST",
        body: "01234567890",
      }),
      10,
    ),
    RequestBodyTooLargeError,
  );
});

test("webhook timestamps reject stale and malformed requests", () => {
  const nowMs = Date.UTC(2026, 6, 23, 12, 0, 0);
  assert.equal(
    isFreshWebhookTimestamp({
      timestamp: String(nowMs / 1000 - 60),
      toleranceSeconds: 300,
      nowMs,
    }),
    true,
  );
  assert.equal(
    isFreshWebhookTimestamp({
      timestamp: String(nowMs / 1000 - 301),
      toleranceSeconds: 300,
      nowMs,
    }),
    false,
  );
  assert.equal(
    isFreshWebhookTimestamp({
      timestamp: "not-a-timestamp",
      toleranceSeconds: 300,
      nowMs,
    }),
    false,
  );
});

