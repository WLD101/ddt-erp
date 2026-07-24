import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import { evaluateIntegrationPermission } from "@/modules/integrations/core/permissions";
import type { IntegrationActionDefinition, TenantIntegrationRecord } from "@/modules/integrations/core/types";

const lowRiskAction: IntegrationActionDefinition = {
  key: "internal_test.read_record",
  name: "Read",
  description: "Read a test record",
  capability: "internal_test.read",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  allowedRequestSources: ["user", "voice_agent"],
  sensitivity: "low",
  confirmationRequired: false,
  approvalPolicy: "none",
  idempotencyRequired: false,
  auditRequired: true,
  timeoutMs: 1000,
  retryPolicy: "none",
};

const highRiskAction: IntegrationActionDefinition = {
  ...lowRiskAction,
  key: "internal_test.create_record",
  capability: "internal_test.write",
  sensitivity: "high",
  approvalPolicy: "tenant_configurable",
};

const integration: TenantIntegrationRecord = {
  id: "conn_1",
  organizationId: "org_1",
  providerKey: "internal_test",
  connectionName: "Internal Test",
  status: "connected",
  healthStatus: "healthy",
  encryptedCredentials: "secret",
  credentialVersion: 1,
  grantedScopes: ["internal_test.read", "internal_test.write"],
  selectedResources: [],
  configuration: {},
  fieldMappings: [],
  failureCount: 0,
};

test("low-risk action is allowed when scopes and source are valid", () => {
  const decision = evaluateIntegrationPermission({
    providerEnabled: true,
    featureEnabled: true,
    planAllowed: true,
    requestSource: "user",
    integration,
    action: lowRiskAction,
    grantedScopes: integration.grantedScopes,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.requiresApproval, false);
});

test("high-risk action requires approval without an explicit allow rule", () => {
  const decision = evaluateIntegrationPermission({
    providerEnabled: true,
    featureEnabled: true,
    planAllowed: true,
    requestSource: "user",
    integration,
    action: highRiskAction,
    grantedScopes: integration.grantedScopes,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.requiresApproval, true);
});

test("deny rule blocks action execution", () => {
  const decision = evaluateIntegrationPermission({
    providerEnabled: true,
    featureEnabled: true,
    planAllowed: true,
    requestSource: "user",
    integration,
    action: lowRiskAction,
    grantedScopes: integration.grantedScopes,
    rules: [
      {
        subjectType: "user",
        subjectId: "user_1",
        actionKey: "internal_test.read_record",
        effect: "deny",
      },
    ],
    userId: "user_1",
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, "RULE_DENY");
});
