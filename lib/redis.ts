import { Redis } from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };
let connectPromise: Promise<void> | null = null;

function createRedis() {
  const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: (times) => {
      // Stop retrying after 3 attempts — we're in local dev without Redis
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });
  // Silence unhandled connection errors (Redis optional in local dev)
  client.on("error", () => {});
  return client;
}

export const redis = globalForRedis.redis || createRedis();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export async function ensureRedisConnection() {
  if (redis.status === "ready" || redis.status === "connecting") {
    return;
  }

  if (!connectPromise) {
    connectPromise = redis.connect().then(() => undefined).finally(() => {
      connectPromise = null;
    });
  }

  await connectPromise;
}

export default redis;
