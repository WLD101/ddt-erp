import { prisma } from "@/lib/prisma";
import { redactSensitiveText } from "@/lib/security/redaction";
import { z } from "zod";
import { createDeterministicEventId } from "./idempotency";

export const TELECOM_JOB_TYPES = [
  "TELECOM_INITIATE_PROVIDER_CALL",
  "TELECOM_PROCESS_PROVIDER_EVENT",
  "TELECOM_EVALUATE_FALLBACK",
  "TELECOM_RECONCILE_CALL",
  "TELECOM_PROVIDER_HEALTH_CHECK",
  "TELECOM_WEBHOOK_NONCE_CLEANUP",
  "TELECOM_LEGACY_PROJECTION_SYNC",
  "TELECOM_USAGE_FINALIZATION",
  "TELECOM_BILLING_RECONCILIATION",
  "TELECOM_PROVIDER_VERIFICATION",
] as const;

export type TelecomJobType = (typeof TELECOM_JOB_TYPES)[number];
export const TELECOM_WORKER_VERSION = "2026-07-10.stage1";
export const TELECOM_JOB_LEASE_MS = 60_000;
export const TELECOM_JOB_TIMEOUT_MS = 5 * 60_000;

export type TelecomJobPayload = {
  type: TelecomJobType;
  idempotencyKey: string;
  tenantId?: string | null;
  callId?: string | null;
  attemptId?: string | null;
  providerId?: string | null;
  eventId?: string | null;
  metadata?: Record<string, unknown>;
};

type TelecomJobDb = Pick<typeof prisma, "voiceJob">;

const stringId = z.string().trim().min(1).max(191);
const safeMetadataSchema = z.record(z.string(), z.unknown()).default({});

const jobPayloadSchemas = {
  TELECOM_INITIATE_PROVIDER_CALL: z.object({
    tenantId: stringId,
    callId: stringId,
    attemptId: stringId,
  }),
  TELECOM_PROCESS_PROVIDER_EVENT: z.object({
    providerType: z.enum(["twilio", "asterisk"]),
    payload: z.record(z.string(), z.unknown()),
  }),
  TELECOM_EVALUATE_FALLBACK: z.object({
    tenantId: stringId,
    callId: stringId,
    failedAttemptId: stringId,
  }),
  TELECOM_RECONCILE_CALL: z.object({
    limit: z.coerce.number().int().min(1).max(500).default(50),
  }),
  TELECOM_PROVIDER_HEALTH_CHECK: z.object({
    providerId: stringId,
  }),
  TELECOM_WEBHOOK_NONCE_CLEANUP: z.object({
    take: z.coerce.number().int().min(1).max(10_000).default(1000),
  }),
  TELECOM_LEGACY_PROJECTION_SYNC: z.object({
    callId: stringId.optional(),
    attemptId: stringId.optional(),
    tenantId: stringId.optional(),
  }),
  TELECOM_USAGE_FINALIZATION: z.object({
    tenantId: stringId,
    callId: stringId,
    attemptId: stringId,
  }),
  TELECOM_BILLING_RECONCILIATION: z.object({
    tenantId: stringId.optional(),
    callId: stringId.optional(),
  }),
  TELECOM_PROVIDER_VERIFICATION: z.object({
    providerId: stringId,
    verificationType: z.string().trim().min(1).max(80).optional(),
  }),
} satisfies Record<TelecomJobType, z.ZodTypeAny>;

export type ParsedTelecomJobPayload<T extends TelecomJobType> = z.infer<(typeof jobPayloadSchemas)[T]>;

export function createTelecomJobIdempotencyKey(input: TelecomJobPayload) {
  return [
    input.type,
    input.tenantId || "global",
    input.callId || "none",
    input.attemptId || "none",
    input.providerId || "none",
    input.eventId || "none",
    input.idempotencyKey,
  ].join(":");
}

export function isTelecomJobType(type: string): type is TelecomJobType {
  return TELECOM_JOB_TYPES.includes(type as TelecomJobType);
}

export function getTelecomJobMaxAttempts(type: TelecomJobType) {
  switch (type) {
    case "TELECOM_PROCESS_PROVIDER_EVENT":
      return 5;
    case "TELECOM_PROVIDER_HEALTH_CHECK":
    case "TELECOM_RECONCILE_CALL":
    case "TELECOM_WEBHOOK_NONCE_CLEANUP":
    case "TELECOM_BILLING_RECONCILIATION":
      return 3;
    case "TELECOM_INITIATE_PROVIDER_CALL":
    case "TELECOM_EVALUATE_FALLBACK":
      return 1;
    default:
      return 1;
  }
}

export async function enqueueTelecomJob(
  input: TelecomJobPayload & {
    correlationId?: string | null;
    scheduledAt?: Date;
    entityType?: string | null;
    entityId?: string | null;
    db?: TelecomJobDb;
  }
) {
  const db = input.db || prisma;
  const durableIdempotencyKey = createTelecomJobIdempotencyKey(input);
  const payload = serializeTelecomJobPayload(input.type, input.metadata || {});
  const now = new Date();
  const scheduledAt = input.scheduledAt || now;
  const timeoutAt = new Date(scheduledAt.getTime() + TELECOM_JOB_TIMEOUT_MS);

  return db.voiceJob.upsert({
    where: {
      type_idempotencyKey: {
        type: input.type,
        idempotencyKey: durableIdempotencyKey,
      },
    },
    update: {
      payloadJson: payload,
      scheduledAt,
      timeoutAt,
      correlationId: input.correlationId || input.callId || input.attemptId || null,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      organizationId: input.tenantId || null,
      workerVersion: TELECOM_WORKER_VERSION,
      status: "queued",
      deadLetteredAt: null,
      failureCode: null,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      leaseExpiresAt: null,
      lastHeartbeatAt: null,
      cancelRequestedAt: null,
      cancelledAt: null,
      cancelReason: null,
    },
    create: {
      organizationId: input.tenantId || null,
      type: input.type,
      status: "queued",
      idempotencyKey: durableIdempotencyKey,
      correlationId: input.correlationId || input.callId || input.attemptId || null,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      payloadJson: payload,
      workerVersion: TELECOM_WORKER_VERSION,
      maxAttempts: getTelecomJobMaxAttempts(input.type),
      scheduledAt,
      timeoutAt,
    },
  });
}

export function serializeTelecomJobPayload(type: TelecomJobType, metadata: Record<string, unknown>) {
  const parsed = parseTelecomJobPayload(type, metadata);
  return JSON.stringify({
    version: 1,
    type,
    data: parsed,
  });
}

export function parseTelecomJobPayload<T extends TelecomJobType>(type: T, metadata: unknown): ParsedTelecomJobPayload<T> {
  return jobPayloadSchemas[type].parse(metadata) as ParsedTelecomJobPayload<T>;
}

export function parseStoredTelecomJobPayload(type: TelecomJobType, payloadJson: string | null) {
  if (!payloadJson) {
    return parseTelecomJobPayload(type, {});
  }

  const raw = JSON.parse(payloadJson) as unknown;
  const envelope = z.object({
    version: z.coerce.number().int().positive().default(1),
    type: z.string().trim().min(1).optional(),
    data: safeMetadataSchema,
  }).parse(raw);

  if (envelope.type && envelope.type !== type) {
    throw new Error(`Telecom job payload type mismatch. Expected ${type} but found ${envelope.type}.`);
  }

  return parseTelecomJobPayload(type, envelope.data);
}

export function getLeaseExpiry(now = new Date()) {
  return new Date(now.getTime() + TELECOM_JOB_LEASE_MS);
}

export function getTimeoutAt(startedAt = new Date()) {
  return new Date(startedAt.getTime() + TELECOM_JOB_TIMEOUT_MS);
}

export function shouldRecoverAbandonedJob(input: {
  status: string;
  leaseExpiresAt?: Date | null;
  timeoutAt?: Date | null;
  cancelRequestedAt?: Date | null;
  now?: Date;
}) {
  const now = input.now || new Date();
  if (input.status !== "processing") return false;
  if (input.cancelRequestedAt) return true;
  if (input.timeoutAt && input.timeoutAt.getTime() <= now.getTime()) return true;
  if (input.leaseExpiresAt && input.leaseExpiresAt.getTime() <= now.getTime()) return true;
  return false;
}

export function sanitizeJobErrorMessage(message: string) {
  return redactSensitiveText(message);
}

export function createProviderWebhookEventId(providerType: "twilio" | "asterisk", payload: Record<string, unknown>) {
  const explicit =
    payload.EventSid ||
    payload.eventSid ||
    payload.eventId ||
    payload.id ||
    payload.SequenceNumber ||
    payload.sequence;
  if (typeof explicit === "string" && explicit.trim()) {
    return `${providerType}:${explicit.trim()}`;
  }
  return `${providerType}:${createDeterministicEventId(providerType, payload)}`;
}
