import test from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, rateLimitKey, resetRateLimitsForTests } from "../../lib/security/rate-limit";

test("critical public actions can be rate limited", () => {
  resetRateLimitsForTests();
  const key = rateLimitKey("login", "User@Example.com");

  assert.equal(checkRateLimit(key, { limit: 2, windowMs: 1000, now: 100 }).allowed, true);
  assert.equal(checkRateLimit(key, { limit: 2, windowMs: 1000, now: 200 }).allowed, true);

  const blocked = checkRateLimit(key, { limit: 2, windowMs: 1000, now: 300 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 1);
});
