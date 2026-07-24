import assert from "node:assert/strict";
import test from "node:test";

import {
  beginIdempotentExecution,
  createIntegrationRequestHash,
  type IntegrationExecutionStore,
  type StoredIntegrationExecution,
} from "@/modules/integrations/core/idempotency";

function createMemoryStore() {
  const records = new Map<string, StoredIntegrationExecution>();

  const store: IntegrationExecutionStore = {
    async findByIdempotencyKey(idempotencyKey) {
      return records.get(idempotencyKey) || null;
    },
    async createRunning(record) {
      records.set(record.idempotencyKey, record);
    },
    async restartFailed(record) {
      records.set(record.idempotencyKey, record);
    },
    async markCompleted(idempotencyKey, safeResultRedacted) {
      const current = records.get(idempotencyKey)!;
      records.set(idempotencyKey, { ...current, status: "completed", safeResultRedacted });
    },
    async markFailed(idempotencyKey, errorCode) {
      const current = records.get(idempotencyKey)!;
      records.set(idempotencyKey, { ...current, status: "failed", errorCode });
    },
  };

  return { store, records };
}

test("request hashing is stable for equivalent payload shapes", () => {
  const first = createIntegrationRequestHash({
    providerKey: "google_workspace",
    actionKey: "calendar.create_event",
    payload: { b: 2, a: 1 },
  });
  const second = createIntegrationRequestHash({
    providerKey: "google_workspace",
    actionKey: "calendar.create_event",
    payload: { a: 1, b: 2 },
  });

  assert.equal(first, second);
});

test("completed idempotent requests replay safely", async () => {
  const { store } = createMemoryStore();
  const started = await beginIdempotentExecution(store, {
    idempotencyKey: "idem_1",
    requestHash: "hash_1",
  });
  assert.equal(started.replay, false);

  await store.markCompleted("idem_1", { eventId: "evt_1" });

  const replay = await beginIdempotentExecution(store, {
    idempotencyKey: "idem_1",
    requestHash: "hash_1",
  });

  assert.equal(replay.replay, true);
  assert.deepEqual(replay.safeResultRedacted, { eventId: "evt_1" });
});

test("failed idempotent requests can restart with the same request hash", async () => {
  const { store, records } = createMemoryStore();
  await beginIdempotentExecution(store, {
    idempotencyKey: "idem_2",
    requestHash: "hash_2",
  });
  await store.markFailed("idem_2", "PROVIDER_UNAVAILABLE");

  const restart = await beginIdempotentExecution(store, {
    idempotencyKey: "idem_2",
    requestHash: "hash_2",
  });

  assert.equal(restart.replay, false);
  assert.equal(records.get("idem_2")?.status, "running");
});

test("reused idempotency key with different request hash is rejected", async () => {
  const { store } = createMemoryStore();
  await beginIdempotentExecution(store, {
    idempotencyKey: "idem_3",
    requestHash: "hash_3",
  });

  await assert.rejects(() =>
    beginIdempotentExecution(store, {
      idempotencyKey: "idem_3",
      requestHash: "different_hash",
    })
  );
});
