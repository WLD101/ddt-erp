"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Users, ShieldCheck, MapPin, CreditCard, Receipt, Store } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: "General & Profile", href: "/settings", icon: Settings },
    { label: "Integrations Overview", href: "/settings/integrations", icon: Store },
    { label: "Daraz Integration", href: "/settings/integrations/daraz", icon: Store },
    { label: "Shopify", href: "/settings/integrations/shopify", icon: Store },
    { label: "WooCommerce", href: "/settings/integrations/woocommerce", icon: Store },
    { label: "Billing & Plans", href: "/settings/billing", icon: CreditCard },
    { label: "Branch Locations", href: "/settings/branches", icon: MapPin },
    { label: "Users & Teams", href: "/settings/users", icon: Users },
    { label: "Roles & Permissions", href: "/settings/roles", icon: ShieldCheck },
    { label: "Audit Logs", href: "/settings/audit-logs", icon: Receipt },
  ];

  return (
    <div className="flex h-full w-full max-w-7xl mx-auto overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-outline-variant/20 bg-surface-container backdrop-blur-md p-6 overflow-y-auto hidden md:block">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6">Workspace Settings</h3>
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border",
                  isActive 
                    ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]" 
                    : "text-muted-foreground hover:text-on-surface hover:bg-surface-container-low border-transparent"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Settings Content Pane */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-surface-container-low">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
