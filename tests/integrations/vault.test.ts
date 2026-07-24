import assert from "node:assert/strict";
import test from "node:test";

import { integrationCredentialVault } from "@/modules/integrations/core/vault";

test("credential vault encrypts and decrypts payloads", async () => {
  const encrypted = await integrationCredentialVault.encrypt({
    accessToken: "secret-access",
    refreshToken: "secret-refresh",
    metadata: { provider: "internal_test" },
  });

  const decrypted = await integrationCredentialVault.decrypt(encrypted);
  assert.equal(decrypted.accessToken, "secret-access");
  assert.equal(decrypted.refreshToken, "secret-refresh");
  assert.deepEqual(decrypted.metadata, { provider: "internal_test" });
});

test("credential vault fails when envelope is tampered", async () => {
  const encrypted = await integrationCredentialVault.encrypt({
    apiKey: "sensitive-key",
  });

  encrypted.authTag = encrypted.authTag.slice(0, -2) + "ab";

  await assert.rejects(() => integrationCredentialVault.decrypt(encrypted));
});

test("credential vault redacts nested secret fields", () => {
  const redacted = integrationCredentialVault.redact({
    token: "abc",
    nested: { refreshToken: "def" },
    safe: "value",
  });

  assert.deepEqual(redacted, {
    token: "[REDACTED]",
    nested: { refreshToken: "[REDACTED]" },
    safe: "value",
  });
});
