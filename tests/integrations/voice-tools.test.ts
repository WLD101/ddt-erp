import assert from "node:assert/strict";
import test from "node:test";

import { getAvailableVoiceTools } from "@/modules/integrations/core/voice-tools";
import type { TenantIntegrationRecord } from "@/modules/integrations/core/types";

const integration: TenantIntegrationRecord = {
  id: "conn_1",
  organizationId: "org_1",
  providerKey: "internal_test",
  connectionName: "Internal Test",
  status: "connected",
  healthStatus: "healthy",
  encryptedCredentials: "encrypted",
  credentialVersion: 1,
  grantedScopes: ["internal_test.read", "internal_test.write"],
  selectedResources: [],
  configuration: {},
  fieldMappings: [],
  failureCount: 0,
};

test("voice tools only expose allowed integration actions", () => {
  const tools = getAvailableVoiceTools({
    tenantId: "org_1",
    voiceAgentId: "agent_1",
    callId: "call_1",
    industryProfileKey: "service_basic",
    integrations: [integration],
    permissionsByIntegrationId: {
      conn_1: [
        {
          subjectType: "voice_agent",
          subjectId: "agent_1",
          actionKey: "internal_test.read_record",
          effect: "allow",
        },
        {
          subjectType: "voice_agent",
          subjectId: "agent_1",
          actionKey: "internal_test.create_record",
          effect: "deny",
        },
      ],
    },
  });

  assert.equal(tools.some((tool) => tool?.actionKey === "internal_test.read_record"), true);
  assert.equal(tools.some((tool) => tool?.actionKey === "internal_test.create_record"), false);
});
