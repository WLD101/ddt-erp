import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminEmail } from "@/lib/security/access";

export async function GET(request: Request) {
  const session = await auth();
  if (!isPlatformAdminEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Platform admin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const take = Math.min(Math.max(Number(searchParams.get("take") || 50), 1), 100);
  const logs = await prisma.callLog.findMany({
    take,
    orderBy: { createdAt: "desc" },
    include: {
      provider: { select: { name: true, type: true, countryCode: true } },
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ ok: true, logs });
}
