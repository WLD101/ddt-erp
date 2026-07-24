import { IntegrationError } from "./errors";

export type RateLimitPolicy = {
  maxRequests: number;
  windowMs: number;
};

export type RateLimitCounterRecord = {
  bucketKey: string;
  count: number;
  windowStartedAt: Date;
  windowEndsAt: Date;
};

export interface IntegrationRateLimitStore {
  increment(input: {
    bucketKey: string;
    providerKey: string;
    actionKey?: string;
    tenantIntegrationId?: string;
    organizationId: string;
    windowStartedAt: Date;
    windowEndsAt: Date;
  }): Promise<RateLimitCounterRecord>;
}

export const DEFAULT_PROVIDER_RATE_LIMITS: Record<string, RateLimitPolicy> = {
  internal_test: { maxRequests: 30, windowMs: 60_000 },
  google_workspace: { maxRequests: 20, windowMs: 60_000 },
};

export function floorToWindow(now: Date, windowMs: number) {
  const value = now.getTime();
  return new Date(Math.floor(value / windowMs) * windowMs);
}

export function buildRateLimitBucketKey(input: {
  organizationId: string;
  providerKey: string;
  tenantIntegrationId?: string;
  actionKey?: string;
  windowStartedAt: Date;
}) {
  return [
    input.organizationId,
    input.providerKey,
    input.tenantIntegrationId || "all-connections",
    input.actionKey || "all-actions",
    input.windowStartedAt.toISOString(),
  ].join(":");
}

export async function enforceRateLimit(
  store: IntegrationRateLimitStore,
  input: {
    organizationId: string;
    providerKey: string;
    tenantIntegrationId?: string;
    actionKey?: string;
    now?: Date;
    policy?: RateLimitPolicy;
  }
) {
  const policy = input.policy || DEFAULT_PROVIDER_RATE_LIMITS[input.providerKey] || { maxRequests: 60, windowMs: 60_000 };
  const now = input.now || new Date();
  const windowStartedAt = floorToWindow(now, policy.windowMs);
  const windowEndsAt = new Date(windowStartedAt.getTime() + policy.windowMs);
  const bucketKey = buildRateLimitBucketKey({
    organizationId: input.organizationId,
    providerKey: input.providerKey,
    tenantIntegrationId: input.tenantIntegrationId,
    actionKey: input.actionKey,
    windowStartedAt,
  });

  const counter = await store.increment({
    bucketKey,
    providerKey: input.providerKey,
    actionKey: input.actionKey,
    tenantIntegrationId: input.tenantIntegrationId,
    organizationId: input.organizationId,
    windowStartedAt,
    windowEndsAt,
  });

  if (counter.count > policy.maxRequests) {
    throw new IntegrationError("RATE_LIMITED", "This integration is temporarily rate limited. Please retry shortly.", {
      statusCode: 429,
      safeDetails: {
        retryAfterSeconds: Math.max(1, Math.ceil((windowEndsAt.getTime() - now.getTime()) / 1000)),
        bucketKey,
      },
    });
  }

  return counter;
}
