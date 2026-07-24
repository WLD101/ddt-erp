import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { evaluateRoutingDecision } from "@/modules/calls/routing-engine";
import { routeSimulationSchema } from "@/modules/calls/schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!isPlatformAdminEmail(session?.user?.email)) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Platform admin access required." } }, { status: 403 });
  }

  const input = routeSimulationSchema.parse(await request.json());
  const tenant = await prisma.organization.findUnique({ where: { id: input.tenantId }, select: { id: true } });
  if (!tenant) {
    return NextResponse.json({ success: false, error: { code: "TENANT_NOT_FOUND", message: "Tenant not found." } }, { status: 404 });
  }

  const decision = await evaluateRoutingDecision({
    tenantId: input.tenantId,
    destination: input.destination,
    callerNumberId: input.callerNumberId || null,
    simulateAt: input.simulateAt ? new Date(input.simulateAt) : null,
    requireCallerId: false,
  });

  if (session?.user?.id) {
    await prisma.platformAuditLog.create({
      data: {
        actorId: session.user.id,
        action: "telecom.route_simulation.run",
        entityType: "Organization",
        entityId: input.tenantId,
        details: JSON.stringify({
          countryCode: decision.countryCode,
          selectedProviderId: decision.selectedProvider?.id || null,
          allowed: decision.allowed,
          rejectionCode: decision.rejectionCode || null,
        }),
      },
    }).catch(() => null);
  }

  return NextResponse.json({
    success: true,
    data: {
      normalizedDestination: decision.normalizedDestination,
      countryCode: decision.countryCode,
      allowed: decision.allowed,
      selectedProvider: decision.selectedProvider
        ? { id: decision.selectedProvider.id, name: decision.selectedProvider.name }
        : null,
      selectedCallerNumber: decision.selectedCallerNumber
        ? { id: decision.selectedCallerNumber.id, maskedNumber: decision.selectedCallerNumber.maskedNumber }
        : null,
      matchedRuleId: decision.matchedRuleId,
      fallbackProviders: decision.fallbackProviders.map((provider) => ({ id: provider.id, name: provider.name })),
      decisionTrace: decision.decisionTrace,
      estimatedRate: null,
      currency: null,
      rejectionCode: decision.rejectionCode || null,
      rejectionMessage: decision.rejectionMessage || null,
    },
  });
}
