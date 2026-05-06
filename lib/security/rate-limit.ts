import redis from "@/lib/redis";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const memoryFallback = new Map<string, { count: number; expiresAt: number }>();
let hasLoggedRedisFallback = false;

function checkMemoryRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const current = memoryFallback.get(key);

  if (!current || current.expiresAt <= now) {
    memoryFallback.set(key, {
      count: 1,
      expiresAt: now + options.windowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  memoryFallback.set(key, current);

  if (current.count > options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Redis-backed fixed-window rate limiter.
 * 
 * @param key The identifier to limit (e.g. "login:user@email.com")
 * @param options limit and window in milliseconds
 */
export async function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const fullKey = `ratelimit:${key}`;
  
  try {
    const current = await Promise.race([
      redis.incr(fullKey),
      new Promise<number>((_, reject) => setTimeout(() => reject(new Error("Redis timeout")), 500))
    ]);
    
    if (current === 1) {
      // First hit, set expiry
      await Promise.race([
        redis.pexpire(fullKey, options.windowMs),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Redis timeout")), 500))
      ]);
    }
    
    if (current > options.limit) {
      const ttl = await Promise.race([
        redis.pttl(fullKey),
        new Promise<number>((_, reject) => setTimeout(() => reject(new Error("Redis timeout")), 500))
      ]);
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(ttl / 1000),
      };
    }
    
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (error) {
    // Fallback to in-memory protection so public auth and OTP flows
    // are still throttled if Redis is unavailable.
    if (!hasLoggedRedisFallback) {
      console.error("[RateLimit Fallback] Redis unavailable, using in-memory limiter:", error);
      hasLoggedRedisFallback = true;
    }
    return checkMemoryRateLimit(fullKey, options);
  }
}

export function rateLimitKey(scope: string, identifier: string | null | undefined) {
  return `${scope}:${(identifier || "anonymous").trim().toLowerCase()}`;
}
