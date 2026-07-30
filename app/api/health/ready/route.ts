import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';

export async function GET() {
  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis (if configured)
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
      await redis.ping();
      redis.disconnect();
    }

    return NextResponse.json(
      { status: 'ready', database: 'connected', redis: 'connected' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Readiness check failed:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 503 }
    );
  }
}
