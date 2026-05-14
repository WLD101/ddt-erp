import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  const status: Record<string, any> = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      database: "down",
      redis: "down",
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.services.database = "up";
  } catch (e) {
    status.services.database = "down";
    console.error("[health] database check failed", e);
  }

  try {
    const ping = await redis.ping();
    status.services.redis = ping === "PONG" ? "up" : "down";
  } catch (e) {
    status.services.redis = "down";
  }

  const isUp = status.services.database === "up" && status.services.redis === "up";

  return NextResponse.json(status, { status: isUp ? 200 : 503 });
}
