import type { ConnectionTestResult, IntegrationHealthStatus, TenantIntegrationRecord } from "./types";

export function evaluateIntegrationHealth(input: {
  integration: TenantIntegrationRecord;
  testResult?: ConnectionTestResult | null;
  now?: Date;
}) : IntegrationHealthStatus {
  const now = input.now || new Date();
  if (input.integration.status === "disabled") return "disabled";
  if (!input.integration.encryptedCredentials) return "misconfigured";
  if (input.integration.expiresAt && input.integration.expiresAt.getTime() <= now.getTime()) {
    return "expired";
  }
  if (input.integration.failureCount >= 3) {
    return "degraded";
  }
  if (input.testResult && !input.testResult.success) {
    return "provider_unavailable";
  }
  if (input.integration.status === "reconnect_required") {
    return "reconnect_required";
  }
  return "healthy";
}
