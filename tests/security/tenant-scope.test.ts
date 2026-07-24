import assert from "node:assert/strict";
import test from "node:test";

import {
  getTenantScopeField,
  scopeTenantOperationArgs,
} from "../../lib/security/tenant-scope";

test("organization-scoped reads override caller-supplied tenant filters", () => {
  const input = { where: { organizationId: "org_other", status: "ACTIVE" } };
  const scoped = scopeTenantOperationArgs("VoiceAgent", "findMany", input, "org_current");

  assert.deepEqual(scoped?.where, {
    organizationId: "org_current",
    status: "ACTIVE",
  });
  assert.equal(input.where.organizationId, "org_other");
});

test("organization-scoped updates cannot transfer records to another tenant", () => {
  const scoped = scopeTenantOperationArgs(
    "Customer",
    "update",
    {
      where: { id: "customer_1" },
      data: { organizationId: "org_other", name: "Updated" },
    },
    "org_current",
  );

  assert.deepEqual(scoped?.where, {
    id: "customer_1",
    organizationId: "org_current",
  });
  assert.deepEqual(scoped?.data, {
    organizationId: "org_current",
    name: "Updated",
  });
});

test("createMany scopes both single and array data", () => {
  const single = scopeTenantOperationArgs(
    "VoiceCallLog",
    "createMany",
    { data: { organizationId: "org_other", providerCallId: "call_1" } },
    "org_current",
  );
  const multiple = scopeTenantOperationArgs(
    "VoiceCallLog",
    "createMany",
    {
      data: [
        { organizationId: "org_other", providerCallId: "call_1" },
        { providerCallId: "call_2" },
      ],
    },
    "org_current",
  );

  assert.equal((single?.data as Record<string, unknown>).organizationId, "org_current");
  assert.deepEqual(
    (multiple?.data as Array<Record<string, unknown>>).map((item) => item.organizationId),
    ["org_current", "org_current"],
  );
});

test("telecom models use tenantId and upserts scope every write branch", () => {
  const scoped = scopeTenantOperationArgs(
    "Call",
    "upsert",
    {
      where: { id: "call_1", tenantId: "org_other" },
      create: { tenantId: "org_other", providerCallId: "provider_1" },
      update: { tenantId: "org_other", status: "ENDED" },
    },
    "org_current",
  );

  assert.equal(getTenantScopeField("Call"), "tenantId");
  assert.equal((scoped?.where as Record<string, unknown>).tenantId, "org_current");
  assert.equal((scoped?.create as Record<string, unknown>).tenantId, "org_current");
  assert.equal((scoped?.update as Record<string, unknown>).tenantId, "org_current");
});

test("non-tenant models are left unchanged", () => {
  const input = { where: { id: "user_1" } };
  assert.equal(scopeTenantOperationArgs("User", "findUnique", input, "org_current"), input);
});

test("sensitive tenant assets are scoped for read, update, and delete operations", () => {
  const models = [
    "Customer",
    "VoiceCallLog",
    "TenantIntegration",
    "IntegrationOAuthState",
    "AuditLog",
    "IntegrationApprovalRequest",
    "VoiceJob",
    "VoiceWebhookEvent",
  ];

  for (const model of models) {
    for (const operation of ["findMany", "update", "delete"]) {
      const scoped = scopeTenantOperationArgs(
        model,
        operation,
        {
          where: { id: "asset_1", organizationId: "org_other" },
          ...(operation === "update"
            ? { data: { organizationId: "org_other", status: "changed" } }
            : {}),
        },
        "org_current",
      );
      assert.equal(
        (scoped?.where as Record<string, unknown>).organizationId,
        "org_current",
      );
      if (operation === "update") {
        assert.equal(
          (scoped?.data as Record<string, unknown>).organizationId,
          "org_current",
        );
      }
    }
  }
});
