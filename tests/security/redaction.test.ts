import assert from "node:assert/strict";
import test from "node:test";

import {
  redactForLogging,
  redactSensitiveText,
} from "../../lib/security/redaction";

test("log redaction removes credentials, JWTs, and connection passwords", () => {
  const jwt = `eyJ${"a".repeat(12)}.${"b".repeat(12)}.${"c".repeat(12)}`;
  const result = redactSensitiveText(
    `Bearer top-secret token=abc123 postgresql://user:pass@db:5432/app ${jwt}`,
  );

  assert.equal(result.includes("top-secret"), false);
  assert.equal(result.includes("abc123"), false);
  assert.equal(result.includes(":pass@"), false);
  assert.equal(result.includes(jwt), false);
});

test("structured log redaction removes sensitive fields recursively", () => {
  assert.deepEqual(
    redactForLogging({
      tenantId: "org_1",
      authorization: "Bearer secret",
      nested: { refreshToken: "token-value", status: "failed" },
    }),
    {
      tenantId: "org_1",
      authorization: "[REDACTED]",
      nested: { refreshToken: "[REDACTED]", status: "failed" },
    },
  );
});

