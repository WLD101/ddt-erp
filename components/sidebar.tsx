import Link from "next/link";
import { 
  Building2, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  CreditCard,
  FileText,
  ShieldAlert,
  Bell
} from "lucide-react";
import { PlanUsageWidget } from "./billing/PlanUsageWidget";
import { getUnreadCount } from "@/modules/notifications/actions";
import { WhatsNewTrigger } from "./dashboard/whats-new-panel";
import { getPublishedChangelogs } from "@/modules/changelog/actions";

export async function Sidebar({ lowStockCount = 0 }: { lowStockCount?: number }) {
  const unreadNotifications = await getUnreadCount().catch(() => 0);
  const changelogs = await getPublishedChangelogs().catch(() => []);
  return (
    <aside className="w-64 border-r border-white/5 bg-background/50 backdrop-blur-xl hidden md:block">
      <div className="h-full flex flex-col">
        <div className="h-16 border-b border-white/5 flex items-center px-6 bg-gradient-to-r from-transparent to-primary/5">
          <Building2 className="w-6 h-6 mr-3 font-bold text-primary drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
          <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            ERP.io
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-auto">
          <SidebarItem href="/" icon={<LayoutDashboard className="w-4 h-4"/>} label="Dashboard" />
          <SidebarItem href="/sales" icon={<ShoppingCart className="w-4 h-4"/>} label="Sales" />
          <SidebarItem href="/purchases" icon={<FileText className="w-4 h-4"/>} label="Purchases" />
          <SidebarItem 
            href="/inventory" 
            icon={<Package className="w-4 h-4"/>} 
            label="Inventory" 
            badge={lowStockCount > 0 ? lowStockCount : undefined}
          />
          <SidebarItem href="/reports" icon={<FileText className="w-4 h-4"/>} label="Reports" />
          <SidebarItem href="/customers" icon={<Users className="w-4 h-4"/>} label="Customers" />
          <SidebarItem href="/suppliers" icon={<Users className="w-4 h-4"/>} label="Suppliers" />
          <SidebarItem href="/finances/accounts" icon={<CreditCard className="w-4 h-4"/>} label="Treasury" />
        </nav>

        <PlanUsageWidget />

        <div className="p-4 border-t border-white/5 space-y-1 mb-2">
          <SidebarItem href="/settings" icon={<Settings className="w-4 h-4"/>} label="Settings" />
          <SidebarItem href="/settings/audit-logs" icon={<ShieldAlert className="w-4 h-4"/>} label="Audit Logs" />
          <SidebarItem href="/notifications" icon={<Bell className="w-4 h-4"/>} label="Notifications" badge={unreadNotifications > 0 ? unreadNotifications : undefined} badgeVariant="primary" />
          <WhatsNewTrigger entries={changelogs.slice(0, 5)} />
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ href, icon, label, badge, badgeVariant = "destructive" }: { href: string; icon: React.ReactNode; label: string; badge?: number; badgeVariant?: "destructive" | "primary" }) {
  return (
    <Link 
      href={href} 
      className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground transition-all duration-300 ease-out hover:bg-primary/10 hover:text-primary hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-4px_rgba(124,58,237,0.3)] border border-transparent hover:border-primary/20"
    >
      <div className="flex items-center space-x-3">
        <span className="text-primary/70">{icon}</span>
        <span>{label}</span>
      </div>
      {badge !== undefined && (
        <span className={`text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center ${
          badgeVariant === "primary"
            ? "bg-primary shadow-[0_0_10px_rgba(124,58,237,0.4)]"
            : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}
