import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { getLowStockItems } from "@/modules/inventory/actions";

import { PlanProvider } from "@/components/billing/PlanProvider";
import { auth } from "@/lib/auth";
import { getCurrentTenantContext } from "@/lib/tenant";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrganizationAccessState } from "@/lib/billing/access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/");
  }

  if (isPlatformAdminEmail(session.user.email)) {
    const adminMembership = await prisma.organizationUser.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (!adminMembership) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-container-lowest px-6">
          <div className="max-w-xl rounded-3xl border border-outline-variant/30 bg-surface p-8 text-center shadow-soft">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Admin Access</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-on-surface">No tenant workspace is assigned to this admin user.</h1>
            <p className="mt-3 text-sm text-on-surface-variant">
              You can still use the WhatsQuery command center, or attach this admin account to an organization before opening tenant ERP routes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary">
                Go to Dashboard
              </Link>
              <Link href="/pricing" className="rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-bold text-on-surface">
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  const ctx = await getCurrentTenantContext();
  const access = await getOrganizationAccessState(ctx.organizationId);
  const { headers } = await import("next/headers");
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  if (!["active", "grace_period"].includes(access.status)) {
    const target = access.redirectTo || "/settings/billing";
    if (pathname !== target && !pathname.startsWith("/settings/billing")) {
      redirect(target);
    }
  }

  let lowStockItems: Awaited<ReturnType<typeof getLowStockItems>> = [];

  let isDemoWorkspace = false;
  let subscriptionStatus = "active";
  let trialDaysRemaining = 0;
  const accessWarning = access.warning;

  try {
    lowStockItems = await getLowStockItems();
    const organization = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { isDemoTenant: true },
    });
    isDemoWorkspace = organization?.isDemoTenant ?? false;
    
    // Fetch monetization state
    const { getSubscriptionContext } = await import("@/lib/billing/enforcement");
    const subCtx = await getSubscriptionContext(ctx.organizationId);
    subscriptionStatus = access.status === "grace_period" ? "grace_period" : subCtx.status;
    trialDaysRemaining = subCtx.daysRemaining;
  } catch {
    // Fall back to a minimal dashboard shell if tenant-scoped extras fail.
  }

  return (
    <PlanProvider>
      <div className="flex min-h-screen w-full bg-surface-container-lowest overflow-hidden">
        <Sidebar lowStockCount={lowStockItems.length} />
        <div className="flex flex-col flex-1 min-w-0 md:pl-[260px]">
          
          {isDemoWorkspace ? (
            <div className="w-full bg-primary-container/20 border-b border-outline-variant px-6 py-2.5 flex items-center justify-center gap-3 backdrop-blur-md z-50">
              <span className="material-symbols-outlined text-primary text-[18px]">info</span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                Demo Workspace
              </p>
              <Link 
                href="/auth/signup" 
                className="ml-3 px-3 py-1 bg-primary text-on-primary rounded-md text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:opacity-90"
              >
                Create Account
              </Link>
            </div>
          ) : accessWarning ? (
            <div className="w-full bg-amber-500/10 border-b border-outline-variant px-6 py-2.5 flex items-center justify-center gap-3 backdrop-blur-md z-50">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface">
                {accessWarning}
              </p>
              <Link 
                href="/settings/billing" 
                className="ml-3 px-3 py-1 bg-amber-500 text-on-surface rounded-md text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:opacity-90"
              >
                Resolve
              </Link>
            </div>
          ) : subscriptionStatus === "expired" ? (
            <div className="w-full bg-error-container/20 border-b border-outline-variant px-6 py-2.5 flex items-center justify-center gap-3 backdrop-blur-md z-50">
              <span className="material-symbols-outlined text-error text-[18px]">error</span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-error">
                Trial Expired. Operations Restricted.
              </p>
              <Link 
                href="/settings/billing" 
                className="ml-3 px-3 py-1 bg-error text-on-error rounded-md text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:opacity-90"
              >
                Upgrade
              </Link>
            </div>
          ) : subscriptionStatus === "trialing" ? (
            <div className="w-full bg-secondary-container/10 border-b border-outline-variant px-6 py-2.5 flex items-center justify-center gap-3 backdrop-blur-md z-50">
              <span className="material-symbols-outlined text-secondary text-[18px]">timer</span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-secondary">
                Trial ends in {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'}.
              </p>
              <Link 
                href="/settings/billing" 
                className="ml-3 px-3 py-1 bg-secondary text-on-secondary rounded-md text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:opacity-90"
              >
                View Plans
              </Link>
            </div>
          ) : null}

          <Navbar />
          <main className="flex-1 overflow-auto bg-surface-container-low/20">
            {children}
          </main>
        </div>
      </div>
    </PlanProvider>
  );
}

