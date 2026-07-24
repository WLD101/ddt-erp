import type { IntegrationProviderAdapter } from "./contracts";
import { getIntegrationProviderDefinition } from "./registry";
import { internalTestProviderAdapter } from "../providers/internal-test/adapter";
import { googleWorkspaceProviderAdapter } from "../providers/google-workspace/adapter";

const adapters = new Map<string, IntegrationProviderAdapter>([
  [internalTestProviderAdapter.key, internalTestProviderAdapter],
  [googleWorkspaceProviderAdapter.key, googleWorkspaceProviderAdapter],
]);

export function getIntegrationProviderAdapter(providerKey: string) {
  getIntegrationProviderDefinition(providerKey);
  return adapters.get(providerKey) || null;
}
