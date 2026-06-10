import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceSidebar } from "@/components/voice/voice-sidebar";
import { Navbar } from "@/components/navbar";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function VoiceDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const host = await getVoiceRequestHost();

  if (!session?.user?.id) {
    const loginHref = toVoiceExternalPath("/login", host);
    const dashboardHref = toVoiceExternalPath("/dashboard", host);
    redirect(`${loginHref}?callbackUrl=${encodeURIComponent(dashboardHref)}`);
  }

  if (isPlatformAdminEmail(session.user.email)) {
    const adminMembership = await prisma.organizationUser.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (!adminMembership) {
      return (
        <div className="flex min-h-screen w-full bg-surface-container-lowest overflow-hidden">
          <VoiceSidebar isAdmin={isPlatformAdminEmail(session.user.email)} />
          <div className="flex flex-col flex-1 min-w-0 md:pl-[260px]">
            <Navbar />
            <main className="flex-1 overflow-auto bg-surface-container-low/20">
              <div className="flex min-h-[80vh] items-center justify-center px-6">
                <div className="max-w-xl rounded-3xl border border-outline-variant/30 bg-surface p-8 text-center shadow-soft">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Admin Access</p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-on-surface">No tenant workspace is assigned.</h1>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    You can still use the Voice Command Center, or attach this admin account to an organization before opening tenant Voice routes.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href="/dashboard/command-center" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary">
                      Command Center
                    </Link>
                    <Link href="/login" className="rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-bold text-on-surface">
                      Back to Auth
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      );
    }
  }

  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { accessStatus: true },
  });

  if (org?.accessStatus === "payment_pending") {
    const pricingHref = toVoiceExternalPath("/pricing", host);
    redirect(pricingHref);
  }

  return (
    <div className="flex min-h-screen w-full bg-surface-container-lowest overflow-hidden">
      <VoiceSidebar isAdmin={isPlatformAdminEmail(session.user.email)} />
      <div className="flex flex-col flex-1 min-w-0 md:pl-[260px]">
        <Navbar />
        <main className="flex-1 overflow-auto bg-surface-container-low/20">
          <div className="mx-auto max-w-6xl px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
