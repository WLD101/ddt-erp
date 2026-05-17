import test from "node:test";
import assert from "node:assert/strict";
import { parseSafeExternalUrl } from "../../lib/security/outbound-url";

test("public https URLs are accepted for outbound integrations", () => {
  const url = parseSafeExternalUrl("https://store.example.com");
  assert.equal(url.origin, "https://store.example.com");
});

test("localhost and private hosts are rejected for outbound integrations", () => {
  assert.throws(() => parseSafeExternalUrl("http://localhost:3000", { allowHttp: true }));
  assert.throws(() => parseSafeExternalUrl("https://127.0.0.1"));
  assert.throws(() => parseSafeExternalUrl("https://192.168.1.10"));
  assert.throws(() => parseSafeExternalUrl("https://demo.internal"));
});
