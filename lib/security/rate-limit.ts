type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number; now?: number }
): RateLimitResult {
  const now = options.now ?? Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimitsForTests() {
  buckets.clear();
}

export function rateLimitKey(scope: string, identifier: string | null | undefined) {
  return `${scope}:${(identifier || "anonymous").trim().toLowerCase()}`;
}
