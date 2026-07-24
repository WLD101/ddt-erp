import { z } from "zod";

import { getIntegrationActionDefinition, INTEGRATION_ACTIONS } from "./action-registry";
import { isIntegrationFeatureEnabled } from "./feature-flags";
import type { IntegrationProviderDefinition } from "./types";

const internalConnectionSchema = z.object({
  simulateExpiry: z.boolean().default(false),
  simulateProviderFailure: z.boolean().default(false),
  simulateRateLimit: z.boolean().default(false),
});

const emptyConfigSchema = z.object({});

export const INTEGRATION_PROVIDER_REGISTRY: IntegrationProviderDefinition[] = [
  {
    key: "google_workspace",
    name: "Google Workspace",
    description: "Shared Google connection for Calendar, Contacts, Gmail, and Sheets.",
    category: "calendar",
    authType: "oauth2",
    status: "development",
    capabilities: [
      "calendar.read",
      "calendar.write",
      "contacts.read",
      "contacts.write",
      "email.read",
      "email.write",
      "data.read",
      "data.write",
      "voice.tools",
      "sync.read",
      "sync.write",
      "webhooks.inbound",
    ],
    supportedActions: INTEGRATION_ACTIONS.filter((action) =>
      action.key.startsWith("calendar.") ||
      action.key.startsWith("contacts.") ||
      action.key.startsWith("email.") ||
      action.key.startsWith("data.")
    ),
    supportedEvents: [
      { key: "calendar.event.updated", name: "Calendar Event Updated", description: "Google Calendar change notification." },
      { key: "gmail.message.updated", name: "Gmail Message Updated", description: "Future Gmail metadata notification." },
      { key: "sheets.row.changed", name: "Sheet Row Changed", description: "Future Google Sheets change notification." },
    ],
    requiredScopes: ["calendar.read", "calendar.write", "contacts.read", "email.write", "data.read"],
    optionalScopes: ["contacts.write", "email.read", "data.write"],
    supportedIndustryProfiles: ["service_basic", "clinic_voice", "restaurant_voice", "wholesale", "manufacturing", "textile"],
    recommendedForCapabilities: ["supports_future_bookings", "supports_case_management", "supports_quotes"],
    resourceTypes: [
      { key: "calendar", type: "calendar", label: "Calendar" },
      { key: "mailbox", type: "mailbox", label: "Mailbox" },
      { key: "spreadsheet", type: "spreadsheet", label: "Spreadsheet" },
    ],
    supportsSync: true,
    supportsWebhooks: true,
    supportsFieldMapping: true,
    supportsVoiceTools: true,
    featureFlag: "integration_google_workspace",
    connectionSchema: emptyConfigSchema,
    configurationSchema: emptyConfigSchema,
  },
  {
    key: "hubspot",
    name: "HubSpot",
    description: "Future CRM synchronization and lead automation.",
    category: "crm",
    authType: "oauth2",
    status: "development",
    capabilities: ["crm.read", "crm.write", "contacts.read", "contacts.write", "voice.tools"],
    supportedActions: INTEGRATION_ACTIONS.filter((action) => action.key.startsWith("crm.") || action.key.startsWith("contacts.")),
    supportedEvents: [{ key: "crm.contact.updated", name: "CRM Contact Updated", description: "Future CRM webhook event." }],
    resourceTypes: [{ key: "pipeline", type: "pipeline", label: "Pipeline" }],
    supportedIndustryProfiles: ["wholesale", "manufacturing", "service_basic"],
    recommendedForCapabilities: ["supports_quotes", "supports_case_management"],
    supportsSync: true,
    supportsWebhooks: true,
    supportsFieldMapping: true,
    supportsVoiceTools: true,
    featureFlag: "integration_hubspot",
  },
  {
    key: "webhooks",
    name: "Customer Webhooks",
    description: "Outbound customer webhooks for downstream automation.",
    category: "developer_tools",
    authType: "webhook_secret",
    status: "beta",
    capabilities: ["developer.webhook", "webhooks.outbound"],
    supportedActions: [getIntegrationActionDefinition("developer.trigger_webhook")!],
    supportedEvents: [],
    supportsSync: false,
    supportsWebhooks: true,
    supportsFieldMapping: false,
    supportsVoiceTools: false,
    featureFlag: "integration_customer_webhooks",
  },
  {
    key: "universal_rest",
    name: "Universal REST",
    description: "Future approved REST integrations for advanced teams.",
    category: "developer_tools",
    authType: "api_key",
    status: "development",
    capabilities: ["developer.rest"],
    supportedActions: [getIntegrationActionDefinition("developer.execute_rest_operation")!],
    supportedEvents: [],
    supportsSync: false,
    supportsWebhooks: false,
    supportsFieldMapping: true,
    supportsVoiceTools: false,
    featureFlag: "integration_universal_rest",
  },
  {
    key: "internal_test",
    name: "Internal Test Provider",
    description: "Development-only provider that exercises the full shared integration lifecycle.",
    category: "developer_tools",
    authType: "internal",
    status: "beta",
    capabilities: [
      "internal_test.read",
      "internal_test.write",
      "voice.tools",
      "sync.read",
      "webhooks.inbound",
    ],
    supportedActions: [
      getIntegrationActionDefinition("internal_test.read_record")!,
      getIntegrationActionDefinition("internal_test.create_record")!,
    ],
    supportedEvents: [{ key: "internal_test.record.changed", name: "Test Record Changed", description: "Simulated provider event." }],
    featureFlag: "integration_internal_test_provider",
    resourceTypes: [{ key: "sandbox_record", type: "sandbox_record", label: "Sandbox Record" }],
    supportsSync: true,
    supportsWebhooks: true,
    supportsFieldMapping: true,
    supportsVoiceTools: true,
    connectionSchema: internalConnectionSchema,
    configurationSchema: internalConnectionSchema,
  },
];

const providerMap = new Map(INTEGRATION_PROVIDER_REGISTRY.map((provider) => [provider.key, provider]));

export function getIntegrationProviderDefinition(providerKey: string) {
  const provider = providerMap.get(providerKey);
  if (!provider) {
    throw new Error(`Unknown integration provider: ${providerKey}`);
  }
  if (
    provider.featureFlag &&
    !isIntegrationFeatureEnabled(provider.featureFlag as never)
  ) {
    throw new Error(`Integration provider is disabled: ${providerKey}`);
  }
  return provider;
}

export function listAvailableProviderDefinitions() {
  return INTEGRATION_PROVIDER_REGISTRY.filter((provider) => {
    if (!provider.featureFlag) return true;
    return isIntegrationFeatureEnabled(provider.featureFlag as never);
  });
}
