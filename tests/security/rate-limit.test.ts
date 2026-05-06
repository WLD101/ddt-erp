import test from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, rateLimitKey } from "../../lib/security/rate-limit";

test("critical public actions can be rate limited", async () => {
  const key = rateLimitKey("login", "User@Example.com");
  assert.equal(key, "login:user@example.com");

  const res = await checkRateLimit(key, { limit: 2, windowMs: 1000 });
  assert.equal(typeof res.allowed, "boolean");
});

test("rate limit falls back to local protection when Redis is unavailable", async () => {
  const key = rateLimitKey("otp", `fallback-${Date.now()}@example.com`);

  const first = await checkRateLimit(key, { limit: 1, windowMs: 10_000 });
  const second = await checkRateLimit(key, { limit: 1, windowMs: 10_000 });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.equal(second.retryAfterSeconds > 0, true);
});
