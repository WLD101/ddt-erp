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
    { label: "Security", href: "/settings/security", icon: ShieldCheck },
    { label: "Audit Logs", href: "/settings/audit-logs", icon: Receipt },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-[1500px] overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 overflow-y-auto border-r border-outline-variant/20 bg-surface-container px-6 py-8 backdrop-blur-md md:block">
        <h3 className="mb-6 text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">Workspace Settings</h3>
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200",
                  isActive 
                    ? "border-primary/20 bg-primary/10 text-primary shadow-[0_0_15px_rgba(21,65,183,0.12)]" 
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
        <div className="px-5 py-6 md:px-8 md:py-8 xl:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
