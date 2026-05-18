import Link from "next/link";
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
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-primary/15 bg-[linear-gradient(180deg,rgba(21,65,183,0.16),rgba(21,65,183,0.04))] shadow-[0_18px_36px_-22px_rgba(21,65,183,0.6)] ring-1 ring-primary/10">
              <img
                src="/logo-emblem.png"
                alt="WhatsQuery logo"
                width={56}
                height={56}
                draggable={false}
                className="h-14 w-14 rounded-[20px] object-contain drop-shadow-[0_8px_22px_rgba(21,65,183,0.25)]"
              />
            </div>
            <div>
              <h1 className="font-headline-sm text-[1.7rem] font-black leading-none tracking-tight text-on-surface">WhatsQuery</h1>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-primary">ERP Platform</p>
            </div>
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
