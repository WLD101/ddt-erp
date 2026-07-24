import assert from "node:assert/strict";
import test from "node:test";

import { internalTestProviderAdapter } from "@/modules/integrations/providers/internal-test/adapter";

const baseContext = {
  tenantId: "org_1",
  tenantIntegrationId: "conn_1",
  providerKey: "internal_test",
  correlationId: "corr_1",
  requestSource: "user" as const,
  selectedResources: [{ id: "sandbox-alpha", name: "Sandbox Alpha", resourceType: "sandbox_record" }],
  configuration: {},
};

test("internal test provider supports connection, resources, and actions", async () => {
  const connection = await internalTestProviderAdapter.testConnection(baseContext);
  assert.equal(connection.success, true);

  const resources = await internalTestProviderAdapter.getResources!(baseContext, {});
  assert.equal(resources.items.length >= 2, true);

  const readResult = await internalTestProviderAdapter.executeAction!(baseContext, {
    actionKey: "internal_test.read_record",
    payload: {},
  });
  assert.equal(readResult.success, true);

  const writeResult = await internalTestProviderAdapter.executeAction!(baseContext, {
    actionKey: "internal_test.create_record",
    payload: { recordName: "Hello", content: "World" },
  });
  assert.equal(writeResult.success, true);
});

test("internal test provider simulates expiry and rate limits", async () => {
  await assert.rejects(() =>
    internalTestProviderAdapter.testConnection({
      ...baseContext,
      configuration: { simulateExpiry: true },
    })
  );

  await assert.rejects(() =>
    internalTestProviderAdapter.executeAction!(
      {
        ...baseContext,
        configuration: { simulateRateLimit: true },
      },
      {
        actionKey: "internal_test.read_record",
        payload: {},
      }
    )
  );
});
