import { IntegrationError } from "@/modules/integrations/core/errors";
import type { IntegrationProviderAdapter } from "@/modules/integrations/core/contracts";
import type {
  ConnectionTestResult,
  IntegrationActionRequest,
  IntegrationActionResult,
  IntegrationEventRequest,
  IntegrationEventResult,
  IntegrationExecutionContext,
  IntegrationSyncRequest,
  IntegrationSyncResult,
  ResourceQuery,
  ResourceResult,
} from "@/modules/integrations/core/types";

function getSimulationFlags(context: IntegrationExecutionContext) {
  return {
    simulateExpiry: context.configuration?.simulateExpiry === true,
    simulateProviderFailure: context.configuration?.simulateProviderFailure === true,
    simulateRateLimit: context.configuration?.simulateRateLimit === true,
  };
}

function assertProviderAvailability(context: IntegrationExecutionContext) {
  const flags = getSimulationFlags(context);
  if (flags.simulateProviderFailure) {
    throw new IntegrationError("PROVIDER_UNAVAILABLE", "The internal test provider is simulating an outage.", {
      statusCode: 503,
    });
  }
  if (flags.simulateRateLimit) {
    throw new IntegrationError("RATE_LIMITED", "The internal test provider is simulating a rate limit.", {
      statusCode: 429,
    });
  }
  if (flags.simulateExpiry) {
    throw new IntegrationError("CREDENTIALS_EXPIRED", "The internal test provider is simulating expired credentials.", {
      statusCode: 401,
    });
  }
}

function getSandboxRecords(context: IntegrationExecutionContext) {
  const configured = context.selectedResources || [];
  return configured.length > 0
    ? configured
    : [
        { id: "sandbox-alpha", name: "Sandbox Alpha", resourceType: "sandbox_record" },
        { id: "sandbox-beta", name: "Sandbox Beta", resourceType: "sandbox_record" },
      ];
}

export const internalTestProviderAdapter: IntegrationProviderAdapter = {
  key: "internal_test",

  async testConnection(context: IntegrationExecutionContext): Promise<ConnectionTestResult> {
    assertProviderAvailability(context);
    return {
      success: true,
      message: "Internal test provider connection verified.",
      latencyMs: 35,
      scopes: ["internal_test.read", "internal_test.write"],
      externalAccountId: "internal-test-account",
      externalAccountName: "Internal Test Workspace",
    };
  },

  async getResources(_context: IntegrationExecutionContext, _input: ResourceQuery): Promise<ResourceResult> {
    return {
      items: [
        {
          externalId: "sandbox-alpha",
          name: "Sandbox Alpha",
          resourceType: "sandbox_record",
          metadata: { region: "local" },
        },
        {
          externalId: "sandbox-beta",
          name: "Sandbox Beta",
          resourceType: "sandbox_record",
          metadata: { region: "local" },
        },
      ],
    };
  },

  async executeAction(
    context: IntegrationExecutionContext,
    input: IntegrationActionRequest
  ): Promise<IntegrationActionResult> {
    assertProviderAvailability(context);
    const resources = getSandboxRecords(context);
    const targetResource = resources[0] as { id: string; name: string };

    if (input.actionKey === "internal_test.read_record") {
      return {
        success: true,
        status: "completed",
        actionKey: input.actionKey,
        message: "Sandbox record loaded successfully.",
        data: {
          recordId: targetResource.id,
          recordName: targetResource.name,
          resourceId: targetResource.id,
        },
      };
    }

    if (input.actionKey === "internal_test.create_record") {
      return {
        success: true,
        status: "completed",
        actionKey: input.actionKey,
        message: "Sandbox record created successfully.",
        data: {
          recordId: `sandbox-${Date.now()}`,
          created: true,
        },
      };
    }

    throw new IntegrationError("ACTION_NOT_SUPPORTED", `Unsupported internal test action: ${input.actionKey}`);
  },

  async refreshCredentials(context: IntegrationExecutionContext) {
    const flags = getSimulationFlags(context);
    if (!flags.simulateExpiry) {
      return {
        success: true,
        message: "Credentials are already healthy.",
      };
    }

    return {
      success: true,
      accessToken: "internal-test-access-token-refreshed",
      refreshToken: "internal-test-refresh-token-refreshed",
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      message: "Internal test credentials refreshed successfully.",
    };
  },

  async sync(context: IntegrationExecutionContext, input: IntegrationSyncRequest): Promise<IntegrationSyncResult> {
    assertProviderAvailability(context);
    return {
      success: true,
      message: `Internal ${input.direction} sync completed for ${input.entityType}.`,
      nextCursor: `cursor-${Date.now()}`,
      recordsProcessed: 2,
      recordsSucceeded: 2,
      recordsFailed: 0,
    };
  },

  async handleEvent(
    context: IntegrationExecutionContext,
    input: IntegrationEventRequest
  ): Promise<IntegrationEventResult> {
    assertProviderAvailability(context);

    if (input.eventType !== "internal_test.record.changed") {
      throw new IntegrationError("ACTION_NOT_SUPPORTED", `Unsupported internal test event: ${input.eventType}`);
    }

    if (input.payload.duplicate === true) {
      return {
        success: true,
        status: "duplicate",
        message: "Internal test event was safely identified as a duplicate.",
      };
    }

    return {
      success: true,
      status: "processed",
      message: "Internal test event processed successfully.",
    };
  },

  async subscribeWebhooks() {
    return {
      success: true,
      message: "Internal test provider webhook subscription is active.",
      externalSubscriptionId: "internal-webhook-subscription",
    };
  },

  async disconnect() {
    return;
  },
};
