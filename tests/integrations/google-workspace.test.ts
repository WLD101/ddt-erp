import assert from "node:assert/strict";
import test from "node:test";

import { getIntegrationProviderAdapter } from "@/modules/integrations/core/provider-adapters";
import { getIntegrationRecommendations } from "@/modules/integrations/core/recommendations";
import { getIntegrationProviderDefinition } from "@/modules/integrations/core/registry";
import { getScopesForGoogleServices } from "@/modules/integrations/providers/google-workspace/scopes";

const baseContext = {
  tenantId: "org_1",
  tenantIntegrationId: "conn_google_1",
  providerKey: "google_workspace",
  correlationId: "corr_google_1",
  requestSource: "user" as const,
  selectedResources: [],
  credentials: { accessToken: "sandbox-token" },
  configuration: { enabledServices: ["calendar", "gmail", "sheets"], sandboxMode: true },
};

test("google workspace provider definition is shared across Google services", () => {
  const provider = getIntegrationProviderDefinition("google_workspace");
  assert.equal(provider.supportedActions.some((action) => action.key === "calendar.create_event"), true);
  assert.equal(provider.supportedActions.some((action) => action.key === "email.create_draft"), true);
  assert.equal(provider.supportedActions.some((action) => action.key === "data.append_row"), true);
});

test("google workspace scope resolver deduplicates requested services", () => {
  const scopes = getScopesForGoogleServices(["calendar", "calendar", "gmail"]);
  assert.equal(scopes.length >= 4, true);
  assert.equal(new Set(scopes).size, scopes.length);
});

test("google workspace sandbox adapter returns resources and executes supported actions", async () => {
  const adapter = getIntegrationProviderAdapter("google_workspace");
  assert.ok(adapter);

  const connection = await adapter!.testConnection(baseContext);
  assert.equal(connection.success, true);

  const resources = await adapter!.getResources!(baseContext, {});
  assert.equal(resources.items.some((item) => item.resourceType === "calendar"), true);
  assert.equal(resources.items.some((item) => item.resourceType === "spreadsheet"), true);

  const availability = await adapter!.executeAction!(baseContext, {
    actionKey: "calendar.check_availability",
    payload: {
      startAt: "2026-07-23T09:00:00.000Z",
      endAt: "2026-07-23T12:00:00.000Z",
    },
  });
  assert.equal(availability.success, true);

  const append = await adapter!.executeAction!(baseContext, {
    actionKey: "data.append_row",
    payload: { row: { customer: "Demo Buyer", phone: "+923001234567" } },
  });
  assert.equal(append.success, true);

  const processedEvent = await adapter!.handleEvent!(baseContext, {
    eventType: "calendar.event.updated",
    deduplicationKey: "event_1",
    payload: { eventId: "calendar-1" },
  });
  assert.equal(processedEvent.success, true);
  assert.equal(processedEvent.status, "processed");

  const duplicateEvent = await adapter!.handleEvent!(baseContext, {
    eventType: "calendar.event.updated",
    deduplicationKey: "event_1",
    payload: { duplicate: true },
  });
  assert.equal(duplicateEvent.status, "duplicate");
});

test("industry recommendations map Google service suggestions to google workspace provider", () => {
  const results = getIntegrationRecommendations({ industryProfileKey: "service_basic" });
  assert.equal(results.some((item) => item.key === "google_workspace"), true);
});
