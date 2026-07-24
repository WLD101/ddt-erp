import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { getCurrentTenantContext, requireRole, TenantForbiddenError } from "@/lib/tenant";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const isPlatformAdmin = isPlatformAdminEmail(session?.user?.email);

    if (!isPlatformAdmin) {
      const ctx = await getCurrentTenantContext();
      requireRole(ctx, "owner", "admin");
      if (ctx.organizationId !== id) {
        return NextResponse.json({ ok: false, error: "You can only view your own tenant numbers." }, { status: 403 });
      }
    }

    const numbers = await prisma.phoneNumber.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: "desc" },
      include: {
        provider: { select: { name: true, type: true, countryCode: true, status: true } },
      },
    });

    return NextResponse.json({ ok: true, numbers });
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json({ ok: false, error: "Unable to load tenant phone numbers." }, { status: 500 });
  }
}
