import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const status: Record<string, any> = {
    database: "unknown",
    redis: "unknown",
    timestamp: new Date().toISOString(),
  };

  let ready = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database = "connected";
  } catch (err) {
    status.database = "disconnected";
    ready = false;
  }

  try {
    if (redis.status === "ready") {
      await redis.ping();
      status.redis = "connected";
    } else {
      status.redis = "disconnected";
      // Redis might be disconnected in local dev (graceful degradation)
      // If we are in production, we should probably fail readiness if redis is strictly required.
      // But per graceful degradation rules, we only mark it disconnected.
    }
  } catch (err) {
    status.redis = "disconnected";
  }

  return NextResponse.json(status, { status: ready ? 200 : 503 });
}
