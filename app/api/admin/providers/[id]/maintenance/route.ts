import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { setProviderMaintenance } from "@/modules/calls/provider-health";
import { providerMaintenanceSchema } from "@/modules/calls/schema";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isPlatformAdminEmail(session?.user?.email)) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Platform admin access required." } }, { status: 403 });
  }

  const { id } = await context.params;
  const input = providerMaintenanceSchema.parse(await request.json());
  const provider = await setProviderMaintenance(id, input.enabled, input.message || null);

  if (session?.user?.id) {
    await prisma.platformAuditLog.create({
      data: {
        actorId: session.user.id,
        action: input.enabled ? "telecom.provider_maintenance.enabled" : "telecom.provider_maintenance.disabled",
        entityType: "Provider",
        entityId: id,
        details: JSON.stringify({ message: input.message || null }),
      },
    }).catch(() => null);
  }

  return NextResponse.json({
    success: true,
    data: {
      provider: {
        id: provider.id,
        name: provider.name,
        status: provider.status,
        healthStatus: provider.healthStatus,
        manualHealthStatus: provider.manualHealthStatus,
        healthMessage: provider.healthMessage,
      },
    },
  });
}
