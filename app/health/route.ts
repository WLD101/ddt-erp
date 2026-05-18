import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { captureOperationalError } from "@/lib/monitoring/error-tracker";

export async function GET() {
  const status = {
    ok: false,
    timestamp: Date.now(),
  };

  let databaseUp = false;
  let redisUp = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseUp = true;
  } catch (e) {
    console.error("[health] database check failed", e);
    void captureOperationalError("health.database", e);
  }

  try {
    const ping = await redis.ping();
    redisUp = ping === "PONG";
  } catch (e) {
    void captureOperationalError("health.redis", e);
  }

  const isUp = databaseUp && redisUp;
  status.ok = isUp;

  return NextResponse.json(status, { status: isUp ? 200 : 503 });
}
