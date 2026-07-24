import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { listProvidersAndRouting } from "@/modules/calls/service";

export async function GET() {
  const session = await auth();
  if (!isPlatformAdminEmail(session?.user?.email)) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Platform admin access required." } },
      { status: 403 }
    );
  }

  try {
    const data = await listProvidersAndRouting();
    return NextResponse.json({
      ok: true,
      providers: data.providers.map((provider) => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        countryCode: provider.countryCode,
        status: provider.status,
        priority: provider.priority,
        healthStatus: provider.healthStatus,
        manualHealthStatus: provider.manualHealthStatus,
        lastHealthCheckAt: provider.lastHealthCheckAt,
        recentSuccessRate: provider.recentSuccessRate,
        temporaryFailures: provider.temporaryFailures,
        permanentFailures: provider.permanentFailures,
        concurrentActiveCalls: provider.concurrentActiveCalls,
        healthMessage: provider.healthMessage,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      })),
      rules: data.rules,
    });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "PROVIDER_LIST_FAILED", message: "Unable to load providers." } }, { status: 500 });
  }
}
