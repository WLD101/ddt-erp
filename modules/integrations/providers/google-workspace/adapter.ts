import { IntegrationError } from "@/modules/integrations/core/errors";
import type { IntegrationProviderAdapter } from "@/modules/integrations/core/contracts";
import type {
  ConnectionTestResult,
  IntegrationActionRequest,
  IntegrationActionResult,
  IntegrationExecutionContext,
  ResourceQuery,
  ResourceResult,
} from "@/modules/integrations/core/types";

import { getScopesForGoogleServices, type GoogleWorkspaceService } from "./scopes";

function getEnabledServices(context: IntegrationExecutionContext) {
  const configured = context.configuration?.enabledServices;
  if (!Array.isArray(configured) || configured.length === 0) {
    return ["calendar"] as GoogleWorkspaceService[];
  }

  return configured.filter((value): value is GoogleWorkspaceService =>
    ["calendar", "contacts", "gmail", "sheets"].includes(String(value))
  );
}

function assertGoogleWorkspaceReady(context: IntegrationExecutionContext) {
  const sandbox = context.configuration?.sandboxMode === true;
  const accessToken = typeof context.credentials?.accessToken === "string" ? context.credentials.accessToken : null;
  if (!sandbox && !accessToken) {
    throw new IntegrationError("CONNECTION_NOT_READY", "Google Workspace is not configured with usable credentials yet.", {
      statusCode: 412,
    });
  }
}

function buildSandboxResources(services: GoogleWorkspaceService[]): ResourceResult["items"] {
  const items: ResourceResult["items"] = [];

  if (services.includes("calendar")) {
    items.push({
      externalId: "primary",
      name: "Primary Calendar",
      resourceType: "calendar",
      metadata: { service: "calendar", timezone: "Europe/London" },
    });
  }

  if (services.includes("gmail")) {
    items.push({
      externalId: "primary-mailbox",
      name: "Primary Mailbox",
      resourceType: "mailbox",
      metadata: { service: "gmail", draftOnly: true },
    });
  }

  if (services.includes("sheets")) {
    items.push({
      externalId: "sandbox-sheet",
      name: "Sandbox Lead Sheet",
      resourceType: "spreadsheet",
      metadata: { service: "sheets", worksheet: "Leads" },
    });
  }

  return items;
}

export const googleWorkspaceProviderAdapter: IntegrationProviderAdapter = {
  key: "google_workspace",

  async testConnection(context: IntegrationExecutionContext): Promise<ConnectionTestResult> {
    assertGoogleWorkspaceReady(context);
    const services = getEnabledServices(context);

    return {
      success: true,
      message: "Google Workspace sandbox configuration looks valid.",
      latencyMs: 120,
      scopes: getScopesForGoogleServices(services),
      externalAccountId: "google-workspace-sandbox",
      externalAccountName: "Google Workspace Sandbox",
    };
  },

  async getResources(context: IntegrationExecutionContext, _input: ResourceQuery): Promise<ResourceResult> {
    assertGoogleWorkspaceReady(context);
    return {
      items: buildSandboxResources(getEnabledServices(context)),
    };
  },

  async executeAction(
    context: IntegrationExecutionContext,
    input: IntegrationActionRequest
  ): Promise<IntegrationActionResult> {
    assertGoogleWorkspaceReady(context);

    switch (input.actionKey) {
      case "calendar.check_availability":
        return {
          success: true,
          status: "completed",
          actionKey: input.actionKey,
          message: "Sandbox availability returned successfully.",
          data: {
            slots: [
              "2026-07-23T09:00:00.000Z",
              "2026-07-23T10:00:00.000Z",
            ],
          },
        };
      case "calendar.create_event":
      case "calendar.reschedule_event":
      case "calendar.cancel_event":
        return {
          success: true,
          status: "completed",
          actionKey: input.actionKey,
          message: "Sandbox calendar action completed.",
          data: { eventId: "google-sandbox-event-001" },
        };
      case "contacts.search":
        return {
          success: true,
          status: "completed",
          actionKey: input.actionKey,
          message: "Sandbox contact search completed.",
          data: { matches: [{ id: "contact-1", name: "Alex Tenant", phone: "+447700900111" }] },
        };
      case "contacts.create":
      case "contacts.update":
        return {
          success: true,
          status: "completed",
          actionKey: input.actionKey,
          message: "Sandbox contact action completed.",
          data: { contactId: "google-sandbox-contact-001" },
        };
      case "email.create_draft":
      case "email.send":
      case "email.reply":
        return {
          success: true,
          status: "completed",
          actionKey: input.actionKey,
          message: "Sandbox email action completed.",
          data: { messageId: "google-sandbox-message-001" },
        };
      case "data.read_rows":
        return {
          success: true,
          status: "completed",
          actionKey: input.actionKey,
          message: "Sandbox rows loaded successfully.",
          data: { rows: [{ name: "Demo Lead", phone: "+923001234567" }] },
        };
      case "data.append_row":
      case "data.update_row":
        return {
          success: true,
          status: "completed",
          actionKey: input.actionKey,
          message: "Sandbox sheet action completed.",
          data: { rowId: "row-1" },
        };
      default:
        throw new IntegrationError("ACTION_NOT_SUPPORTED", `Unsupported Google Workspace action: ${input.actionKey}`);
    }
  },
};
