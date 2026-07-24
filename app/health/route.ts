import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRedisConnection, redis } from "@/lib/redis";
import { captureOperationalError } from "@/lib/monitoring/error-tracker";

function withHealthTimeout<T>(operation: Promise<T>, timeoutMs = 2_000) {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Health check timed out.")), timeoutMs),
    ),
  ]);
}

export async function GET() {
  const status = {
    ok: false,
    timestamp: Date.now(),
  };

  let databaseUp = false;
  let redisUp = false;

  try {
    await withHealthTimeout(prisma.$queryRaw`SELECT 1`);
    databaseUp = true;
  } catch (e) {
    console.error("[health] database check failed", {
      errorName: e instanceof Error ? e.name : "UnknownError",
    });
    void captureOperationalError("health.database", e);
  }

  try {
    await withHealthTimeout(ensureRedisConnection(), 1_000);
    const ping = await withHealthTimeout(redis.ping(), 1_000);
    redisUp = ping === "PONG";
  } catch (e) {
    void captureOperationalError("health.redis", e);
  }

  const isUp = databaseUp && redisUp;
  status.ok = isUp;

  return NextResponse.json(status, { status: isUp ? 200 : 503 });
}
