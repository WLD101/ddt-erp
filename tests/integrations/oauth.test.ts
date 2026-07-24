import assert from "node:assert/strict";
import test from "node:test";

import { createOAuthState, validateOAuthState, type OAuthStateRecord, type OAuthStateStore } from "@/modules/integrations/core/oauth";

function createMemoryStore() {
  const records = new Map<string, OAuthStateRecord>();

  const store: OAuthStateStore = {
    async save(record) {
      records.set(record.stateId, record);
    },
    async findByStateId(stateId) {
      return records.get(stateId) || null;
    },
    async consume(stateId, consumedAt) {
      const record = records.get(stateId);
      if (!record || record.consumedAt || record.expiresAt <= consumedAt) return false;
      records.set(stateId, { ...record, consumedAt });
      return true;
    },
  };

  return { records, store };
}

test("oauth state validates and consumes once", async () => {
  const { store } = createMemoryStore();
  const created = await createOAuthState(store, {
    tenantId: "org_1",
    userId: "user_1",
    providerKey: "internal_test",
    redirectPath: "/settings/integrations",
  });

  const validated = await validateOAuthState(store, {
    tenantId: "org_1",
    userId: "user_1",
    providerKey: "internal_test",
    state: created.state,
  });

  assert.equal(validated.record.tenantId, "org_1");
  assert.ok(validated.codeVerifier.length > 10);

  await assert.rejects(() =>
    validateOAuthState(store, {
      tenantId: "org_1",
      userId: "user_1",
      providerKey: "internal_test",
      state: created.state,
    })
  );
});

test("oauth state rejects wrong tenant, wrong provider, and unsafe redirects", async () => {
  const { store } = createMemoryStore();
  await assert.rejects(() =>
    createOAuthState(store, {
      tenantId: "org_1",
      userId: "user_1",
      providerKey: "internal_test",
      redirectPath: "https://evil.example.com",
    })
  );

  const created = await createOAuthState(store, {
    tenantId: "org_1",
    userId: "user_1",
    providerKey: "internal_test",
    redirectPath: "/safe-path",
  });

  await assert.rejects(() =>
    validateOAuthState(store, {
      tenantId: "org_2",
      userId: "user_1",
      providerKey: "internal_test",
      state: created.state,
    })
  );

  await assert.rejects(() =>
    validateOAuthState(store, {
      tenantId: "org_1",
      userId: "user_1",
      providerKey: "hubspot",
      state: created.state,
    })
  );

  await assert.rejects(() =>
    validateOAuthState(store, {
      tenantId: "org_1",
      userId: "user_2",
      providerKey: "internal_test",
      state: created.state,
    })
  );
});

test("oauth state rejects expired state", async () => {
  const { records, store } = createMemoryStore();
  const created = await createOAuthState(store, {
    tenantId: "org_1",
    userId: "user_1",
    providerKey: "internal_test",
    redirectPath: "/safe-path",
  });
  const [stateId] = created.state.split(".");
  const existing = records.get(stateId)!;
  records.set(stateId, {
    ...existing,
    expiresAt: new Date(Date.now() - 60_000),
  });

  await assert.rejects(() =>
    validateOAuthState(store, {
      tenantId: "org_1",
      userId: "user_1",
      providerKey: "internal_test",
      state: created.state,
    })
  );
});
