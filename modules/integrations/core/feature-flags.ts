import { isProductionEnv, isTruthyEnv } from "@/lib/security/env";

export const INTEGRATION_FEATURE_FLAGS = [
  "integration_foundation",
  "integration_marketplace_v2",
  "integration_internal_test_provider",
  "integration_voice_tools",
  "integration_sync_engine",
  "integration_approvals",
  "integration_outbound_webhooks",
  "integration_google_workspace",
  "integration_hubspot",
  "integration_customer_webhooks",
  "integration_universal_rest",
] as const;

export type IntegrationFeatureFlag = (typeof INTEGRATION_FEATURE_FLAGS)[number];

export function isIntegrationFeatureEnabled(flag: IntegrationFeatureFlag, nodeEnv = process.env.NODE_ENV) {
  if (!isProductionEnv(nodeEnv)) {
    return true;
  }

  return isTruthyEnv(process.env[flag.toUpperCase()]);
}
