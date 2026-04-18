import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { getLowStockItems } from "@/modules/inventory/actions";

import { PlanProvider } from "@/components/billing/PlanProvider";
import { getCurrentTenantContext } from "@/lib/tenant";
import Link from "next/link";
import { Info } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lowStockItems = await getLowStockItems();
  
  // Safe fetch - will return null if unauthenticated, allowing middleware to handle redirect
  let isDemoWorkspace = false;
  let subscriptionStatus = "active";
  let trialDaysRemaining = 0;
  
  try {
    const ctx = await getCurrentTenantContext();
    isDemoWorkspace = ctx.organization.isDemoTenant;
    
    // Fetch monetization state
    const { getSubscriptionContext } = await import("@/lib/billing/enforcement");
    const subCtx = await getSubscriptionContext(ctx.organizationId);
    subscriptionStatus = subCtx.status;
    trialDaysRemaining = subCtx.daysRemaining;
  } catch (error) {
    // If not authenticated or tenant not found, proceed without error
  }

  return (
    <PlanProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden relative">
        <Sidebar lowStockCount={lowStockItems.length} />
        <div className="flex flex-col flex-1 min-w-0">
          
          {isDemoWorkspace ? (
            <div className="w-full bg-indigo-600/20 border-b border-indigo-500/30 px-6 py-2.5 flex items-center justify-center gap-3 backdrop-blur-md z-50">
              <Info className="w-4 h-4 text-indigo-400" />
              <p className="text-[11px] font-black uppercase tracking-widest text-indigo-100">
                You are in a Temporary Demo Workspace.
              </p>
              <Link 
                href="/signup" 
                className="ml-3 px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-900 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
              >
                Create Real Account
              </Link>
            </div>
          ) : subscriptionStatus === "expired" ? (
            <div className="w-full bg-rose-600/20 border-b border-rose-500/30 px-6 py-2.5 flex items-center justify-center gap-3 backdrop-blur-md z-50">
              <Info className="w-4 h-4 text-rose-400" />
              <p className="text-[11px] font-black uppercase tracking-widest text-rose-100">
                Your trial has expired. Operations are restricted.
              </p>
              <Link 
                href="/settings/billing" 
                className="ml-3 px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white rounded-md text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
              >
                Upgrade Plan
              </Link>
            </div>
          ) : subscriptionStatus === "trialing" ? (
            <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-center gap-3 backdrop-blur-md z-50">
              <Info className="w-4 h-4 text-amber-400" />
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-100">
                Your Pro Trial ends in {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'}.
              </p>
              <Link 
                href="/settings/billing" 
                className="ml-3 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
              >
                View Plans
              </Link>
            </div>
          ) : null}

          <Navbar />
          <main className="flex-1 overflow-auto bg-muted/20 pb-10">
            {children}
          </main>
        </div>
      </div>
    </PlanProvider>
  );
}
