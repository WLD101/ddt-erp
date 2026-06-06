import test from "node:test";
import assert from "node:assert/strict";

import {
  areDebugRoutesEnabled,
  getBootstrapAdminPassword,
  getIntegrationEncryptionSecret,
  isOtpBypassEnabled,
} from "../../lib/security/env";

test("OTP bypass is never enabled in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousBypass = process.env.ALLOW_OTP_BYPASS;

  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = "production";
  env.ALLOW_OTP_BYPASS = "true";

  assert.equal(isOtpBypassEnabled(), false);

  env.NODE_ENV = previousNodeEnv;
  env.ALLOW_OTP_BYPASS = previousBypass;
});

test("debug routes are disabled by default in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousFlag = process.env.ENABLE_DEBUG_ROUTES;

  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = "production";
  env.ENABLE_DEBUG_ROUTES = "false";
  assert.equal(areDebugRoutesEnabled(), false);

  process.env.ENABLE_DEBUG_ROUTES = "true";
  assert.equal(areDebugRoutesEnabled(), true);

  env.NODE_ENV = previousNodeEnv;
  env.ENABLE_DEBUG_ROUTES = previousFlag;
});

test("production integration encryption requires a dedicated secret", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousEnc = process.env.ENCRYPTION_KEY;
  const previousLegacy = process.env.INTEGRATION_CREDENTIAL_SECRET;
  const previousAuth = process.env.AUTH_SECRET;
  const previousNextAuth = process.env.NEXTAUTH_SECRET;

  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = "production";
  delete env.ENCRYPTION_KEY;
  delete env.INTEGRATION_CREDENTIAL_SECRET;
  env.AUTH_SECRET = "auth-only-secret";
  delete env.NEXTAUTH_SECRET;

  assert.throws(() => getIntegrationEncryptionSecret());

  process.env.ENCRYPTION_KEY = "dedicated-encryption-secret";
  assert.equal(getIntegrationEncryptionSecret(), "dedicated-encryption-secret");

  env.NODE_ENV = previousNodeEnv;
  env.ENCRYPTION_KEY = previousEnc;
  env.INTEGRATION_CREDENTIAL_SECRET = previousLegacy;
  env.AUTH_SECRET = previousAuth;
  env.NEXTAUTH_SECRET = previousNextAuth;
});

test("production bootstrap admin password rejects known defaults", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousPassword = process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD;

  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = "production";
  env.SUPER_ADMIN_BOOTSTRAP_PASSWORD = "14789Wagus.";
  assert.throws(() => getBootstrapAdminPassword());

  process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD = "Unique-Temp-Password-2026!";
  assert.equal(getBootstrapAdminPassword(), "Unique-Temp-Password-2026!");

  env.NODE_ENV = previousNodeEnv;
  env.SUPER_ADMIN_BOOTSTRAP_PASSWORD = previousPassword;
});
