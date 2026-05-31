const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function isProductionEnv(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "production";
}

export function isTruthyEnv(value: string | undefined | null) {
  if (!value) return false;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret && isProductionEnv()) {
    throw new Error("Missing AUTH_SECRET or NEXTAUTH_SECRET in production.");
  }
  return secret;
}

export function isOtpBypassEnabled() {
  if (isProductionEnv()) return false;
  return isTruthyEnv(process.env.ALLOW_OTP_BYPASS);
}

export function areDebugRoutesEnabled() {
  if (!isProductionEnv()) return true;
  return isTruthyEnv(process.env.ENABLE_DEBUG_ROUTES);
}

export function getIntegrationEncryptionSecret() {
  const strongSecret =
    process.env.ENCRYPTION_KEY ||
    process.env.INTEGRATION_CREDENTIAL_SECRET;

  if (strongSecret) {
    return strongSecret;
  }

  if (isProductionEnv()) {
    throw new Error(
      "Missing ENCRYPTION_KEY or INTEGRATION_CREDENTIAL_SECRET in production."
    );
  }

  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-insecure-secret";
}

export function getSecurityEncryptionSecret() {
  const strongSecret =
    process.env.SECURITY_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY ||
    process.env.INTEGRATION_CREDENTIAL_SECRET;

  if (strongSecret) {
    return strongSecret;
  }

  if (isProductionEnv()) {
    throw new Error(
      "Missing SECURITY_ENCRYPTION_KEY, ENCRYPTION_KEY, or INTEGRATION_CREDENTIAL_SECRET in production."
    );
  }

  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-insecure-secret";
}

export function getBootstrapAdminPassword() {
  const password = process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD;
  if (!password) {
    throw new Error(
      "Missing SUPER_ADMIN_BOOTSTRAP_PASSWORD. Set a unique bootstrap password before creating a production admin."
    );
  }

  const forbiddenDefaults = new Set(["14789Wagus.", "14789Wagus", "Demo123!"]);
  if (isProductionEnv() && forbiddenDefaults.has(password)) {
    throw new Error(
      "SUPER_ADMIN_BOOTSTRAP_PASSWORD is using a known default. Set a unique production password before continuing."
    );
  }

  return password;
}
