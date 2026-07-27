import { Logo } from "@/components/ui/logo";

// ... existing imports ...
// Wait, I need to make sure I don't overwrite imports completely.
// Let's do a precise replace for the block.
import { PlanUsageWidget } from "./billing/PlanUsageWidget";
import { getUnreadCount } from "@/modules/notifications/actions";
import { WhatsNewTrigger } from "./dashboard/whats-new-panel";
import { getPublishedChangelogs } from "@/modules/changelog/actions";
import { getCurrentTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { SidebarActiveLink } from "./sidebar-active-link";
import { signOutAction } from "@/modules/auth/actions";
import { CommandPalette } from "./dashboard/CommandPalette";

export async function Sidebar({ lowStockCount = 0 }: { lowStockCount?: number }) {
  const unreadNotifications = await getUnreadCount().catch(() => 0);
  const changelogs = await getPublishedChangelogs().catch(() => []);
  const ctx = await getCurrentTenantContext().catch(() => null);
  const organization = ctx
    ? await prisma.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { industryType: true },
      })
    : null;
  const isManufacturingOrganization = organization?.industryType === "manufacturing";
  
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[260px] flex-col justify-between border-r border-outline-variant/30 bg-white shadow-soft md:flex">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-7 py-8">
          <div className="flex justify-center w-full">
            <Logo variant="vertical" size="sm" subtitle="ERP PLATFORM" />
          </div>
        </div>
        <div className="mt-4 px-4">
          <CommandPalette />
        </div>

        <nav className="mt-6 space-y-1 px-4">
          <SidebarActiveLink href="/dashboard" icon="dashboard" label="Dashboard" />
          <div className="pt-6 pb-2 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">Entities</div>
          <SidebarActiveLink href="/dashboard/customers" icon="groups" label="Customers" />
          <SidebarActiveLink href="/dashboard/suppliers" icon="factory" label="Suppliers" />
          <SidebarActiveLink href="/dashboard/products" icon="inventory_2" label="Products" />
          
          <div className="pt-6 pb-2 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">Operations</div>
          <SidebarActiveLink 
            href="/dashboard/inventory" 
            icon="warehouse" 
            label="Inventory" 
            badge={lowStockCount > 0 ? lowStockCount : undefined}
          />
          <SidebarActiveLink href="/sales" icon="payments" label="Sales" />
          <SidebarActiveLink href="/purchases" icon="shopping_cart" label="Purchases" />
          {isManufacturingOrganization ? (
            <SidebarActiveLink
              href="/dashboard/production"
              icon="precision_manufacturing"
              label="Production"
            />
          ) : null}
          <SidebarActiveLink href="/finances/accounts" icon="account_balance_wallet" label="Finance" />
          <SidebarActiveLink href="/dashboard/reports" icon="monitoring" label="Reports" />
          <SidebarActiveLink href="/dashboard/assistant" icon="smart_toy" label="Smart Assistant" />
          
          <div className="pt-6 pb-2 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">System</div>
          <SidebarActiveLink href="/settings/integrations" icon="hub" label="Integrations" />
          <SidebarActiveLink href="/settings" icon="settings_suggest" label="Settings" />
        </nav>
      </div>

      <div className="p-4 bg-surface-container-low/30 border-t border-outline-variant/10">
        <div className="mb-4">
          <PlanUsageWidget />
        </div>
        <div className="space-y-1">
          <SidebarActiveLink 
            href="/dashboard/notifications" 
            icon="notifications" 
            label="Notifications" 
            badge={unreadNotifications > 0 ? unreadNotifications : undefined} 
          />
          <WhatsNewTrigger entries={changelogs.slice(0, 5)} />
          <form action={signOutAction}>
            <button 
              type="submit"
              className="w-full flex items-center gap-3 px-5 py-3 text-error hover:bg-error/5 transition-all duration-300 rounded-xl group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">logout</span>
              <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
