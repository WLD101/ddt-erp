import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePlatformAdmin, authorizationErrorResponse } from "@/lib/security/guards";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const [userCount, orgCount] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
    ]);

    return NextResponse.json({
      ok: true,
      userCount,
      orgCount,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}
