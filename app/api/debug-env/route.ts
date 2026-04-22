import { NextResponse } from "next/server";
import { requirePlatformAdmin, authorizationErrorResponse } from "@/lib/security/guards";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return NextResponse.json({
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasSuperAdminEmails: Boolean(process.env.SUPER_ADMIN_EMAILS),
      hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
    });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}
