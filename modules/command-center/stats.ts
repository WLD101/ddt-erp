"use server";

import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import os from "os";

export async function getCommandCenterStats() {
  const stats = {
    infrastructure: {
      cpu: os.loadavg()[0],
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      totalMemory: os.totalmem() / 1024 / 1024,
      redisStatus: redis.status === "ready" ? "Connected" : "Disconnected",
    },
    security: {
      failedLogins: 0,
      recentEvents: [],
    },
    voice: {
      activeCalls: 0,
      totalCalls: 0,
    }
  };

  try {
    // Attempt to fetch real security events
    stats.security.failedLogins = await prisma.securityEvent.count({
      where: { type: "AUTH_FAILURE" },
    });
    const recent = await prisma.securityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    stats.security.recentEvents = recent as any;
  } catch (e) {
    // Table might not exist or be named differently, graceful degradation
  }

  try {
    // Attempt to fetch real voice calls
    stats.voice.totalCalls = await prisma.voiceCallLog.count();
    stats.voice.activeCalls = await prisma.voiceCallLog.count({
      where: { callStatus: "in-progress" },
    });
  } catch (e) {
    // Graceful degradation
  }

  return stats;
}
