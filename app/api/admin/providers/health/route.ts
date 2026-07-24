import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminEmail } from "@/lib/security/access";

export async function GET() {
  const session = await auth();
  if (!isPlatformAdminEmail(session?.user?.email)) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Platform admin access required." } }, { status: 403 });
  }

  const providers = await prisma.provider.findMany({
    orderBy: [{ countryCode: "asc" }, { priority: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      countryCode: true,
      status: true,
      priority: true,
      healthStatus: true,
      manualHealthStatus: true,
      lastHealthCheckAt: true,
      lastSuccessfulCallAt: true,
      lastFailedCallAt: true,
      temporaryFailures: true,
      permanentFailures: true,
      recentSuccessRate: true,
      averageSetupTimeMs: true,
      webhookDelayMs: true,
      concurrentActiveCalls: true,
      providerAvailability: true,
      healthMessage: true,
      healthChecks: {
        take: 1,
        orderBy: { checkedAt: "desc" },
        select: {
          id: true,
          status: true,
          checkedAt: true,
          responseTimeMs: true,
          message: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, data: { providers } });
}
