import { Redis } from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

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

export default redis;
