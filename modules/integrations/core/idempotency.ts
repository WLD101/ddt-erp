import crypto from "node:crypto";

import { IntegrationError } from "./errors";

export type StoredIntegrationExecution = {
  idempotencyKey: string;
  requestHash: string;
  status: "running" | "completed" | "failed";
  safeResultRedacted?: Record<string, unknown> | null;
  errorCode?: string | null;
  expiresAt?: Date | null;
};

export interface IntegrationExecutionStore {
  findByIdempotencyKey(idempotencyKey: string): Promise<StoredIntegrationExecution | null>;
  createRunning(record: StoredIntegrationExecution): Promise<void>;
  restartFailed(record: StoredIntegrationExecution): Promise<void>;
  markCompleted(idempotencyKey: string, safeResultRedacted: Record<string, unknown> | null): Promise<void>;
  markFailed(idempotencyKey: string, errorCode?: string | null): Promise<void>;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

export function createIntegrationRequestHash(input: {
  providerKey: string;
  actionKey: string;
  resourceId?: string;
  payload: Record<string, unknown>;
}) {
  return crypto
    .createHash("sha256")
    .update(
      stableSerialize({
        providerKey: input.providerKey,
        actionKey: input.actionKey,
        resourceId: input.resourceId || null,
        payload: input.payload,
      })
    )
    .digest("hex");
}

export async function beginIdempotentExecution(
  store: IntegrationExecutionStore,
  input: {
    idempotencyKey: string;
    requestHash: string;
    expiresAt?: Date | null;
  }
) {
  const existing = await store.findByIdempotencyKey(input.idempotencyKey);

  if (existing) {
    if (existing.requestHash !== input.requestHash) {
      throw new IntegrationError(
        "VALIDATION_FAILED",
        "This idempotency key was already used for a different integration request.",
        { statusCode: 409, safeDetails: { reason: "idempotency_hash_mismatch" } }
      );
    }

    if (existing.status === "running") {
      throw new IntegrationError(
        "ACTION_NOT_ALLOWED",
        "This integration action is already in progress.",
        { statusCode: 409, safeDetails: { reason: "duplicate_in_progress" } }
      );
    }

    if (existing.status === "completed") {
      return {
        replay: true as const,
        safeResultRedacted: existing.safeResultRedacted || null,
      };
    }

    if (existing.status === "failed") {
      await store.restartFailed({
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        status: "running",
        expiresAt: input.expiresAt || existing.expiresAt || null,
      });

      return {
        replay: false as const,
        safeResultRedacted: null,
      };
    }
  }

  await store.createRunning({
    idempotencyKey: input.idempotencyKey,
    requestHash: input.requestHash,
    status: "running",
    expiresAt: input.expiresAt || null,
  });

  return {
    replay: false as const,
    safeResultRedacted: null,
  };
}
