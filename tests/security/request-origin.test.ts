import assert from "node:assert/strict";
import test from "node:test";

import { getTrustedAppOrigins, isTrustedAppOrigin } from "../../lib/security/request-origin";

test("production origin trust does not accept an attacker-controlled request host", () => {
  const origins = getTrustedAppOrigins(
    "https://attacker.example/api/mutate",
    "production",
  );
  assert.equal(origins.has("https://attacker.example"), false);
  assert.equal(
    isTrustedAppOrigin(
      "https://voice.whatsquery.com",
      undefined,
      "production",
    ),
    true,
  );
});
