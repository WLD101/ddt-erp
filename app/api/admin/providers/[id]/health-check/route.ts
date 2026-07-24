import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { runProviderHealthCheck } from "@/modules/calls/provider-health";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isPlatformAdminEmail(session?.user?.email)) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Platform admin access required." } }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await runProviderHealthCheck(id);

  if (session?.user?.id) {
    await prisma.platformAuditLog.create({
      data: {
        actorId: session.user.id,
        action: "telecom.provider_health_check.requested",
        entityType: "Provider",
        entityId: id,
        details: JSON.stringify({ status: result.evaluation.status }),
      },
    }).catch(() => null);
  }

  return NextResponse.json({
    success: true,
    data: {
      provider: { id: result.provider.id, name: result.provider.name, type: result.provider.type },
      health: result.evaluation,
      check: {
        id: result.check.id,
        checkedAt: result.check.checkedAt,
        responseTimeMs: result.check.responseTimeMs,
      },
    },
  });
}
