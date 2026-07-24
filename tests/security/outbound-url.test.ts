import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedExternalHostname,
  parseSafeExternalUrl,
} from "../../lib/security/outbound-url";

test("public https URLs are accepted for outbound integrations", () => {
  const url = parseSafeExternalUrl("https://store.example.com");
  assert.equal(url.origin, "https://store.example.com");
});

test("localhost and private hosts are rejected for outbound integrations", () => {
  assert.throws(() => parseSafeExternalUrl("http://localhost:3000", { allowHttp: true }));
  assert.throws(() => parseSafeExternalUrl("https://127.0.0.1"));
  assert.throws(() => parseSafeExternalUrl("https://192.168.1.10"));
  assert.throws(() => parseSafeExternalUrl("https://demo.internal"));
  assert.throws(() => parseSafeExternalUrl("https://[::ffff:127.0.0.1]"));
});

test("outbound URLs reject embedded credentials", () => {
  assert.throws(() => parseSafeExternalUrl("https://user:password@example.com"));
});

test("recording host allowlists support exact and controlled wildcard matches", () => {
  const allowed = ["recordings.example.com", "*.trusted.example"];
  assert.equal(isAllowedExternalHostname("recordings.example.com", allowed), true);
  assert.equal(isAllowedExternalHostname("media.trusted.example", allowed), true);
  assert.equal(isAllowedExternalHostname("trusted.example", allowed), false);
  assert.equal(isAllowedExternalHostname("trusted.example.evil.test", allowed), false);
});
