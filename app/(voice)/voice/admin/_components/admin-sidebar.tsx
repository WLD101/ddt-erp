"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  PhoneCall, 
  Bot, 
  BookOpen, 
  CreditCard, 
  PackageSearch,
  Activity,
  FileText,
  Building2,
  ListTodo,
  MessageCircle,
  Server,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/modules/auth/actions";

const navigation = [
  {
    name: "Overview",
    href: "/voice/admin/command-center",
    icon: LayoutDashboard,
  },
  {
    name: "Sales & Pipeline",
    items: [
      { name: "Lead Pipeline", href: "/voice/admin/sales", icon: ListTodo },
      { name: "Demo Accounts", href: "/voice/admin/sales/demos", icon: Users },
    ]
  },
  {
    name: "Control Rooms",
    items: [
      { name: "SOC Dashboard", href: "/voice/admin/soc", icon: ShieldCheck },
      { name: "NOC Dashboard", href: "/voice/admin/noc", icon: Server },
    ]
  },
  {
    name: "Operations",
    items: [
      { name: "Tenant Directory", href: "/voice/admin/tenants", icon: Building2 },
      { name: "Call Logs", href: "/voice/admin/calls", icon: PhoneCall },
      { name: "Vapi Health", href: "/voice/admin/vapi-health", icon: Activity },
      { name: "Telecom Routing", href: "/voice/admin/routing", icon: Activity },
      { name: "WhatsApp Monitor", href: "/voice/admin/whatsapp", icon: MessageCircle },
      { name: "AI Agents", href: "/voice/admin/agents", icon: Bot },
      { name: "Knowledge Base", href: "/voice/admin/knowledge", icon: BookOpen },
      { name: "Templates", href: "/voice/admin/templates", icon: FileText },
    ]
  },
  {
    name: "Billing & Analytics",
    items: [
      { name: "Packages", href: "/voice/admin/packages", icon: PackageSearch },
      { name: "Billing & Invoices", href: "/voice/admin/billing", icon: CreditCard },
      { name: "Audit Logs", href: "/voice/admin/audit-logs", icon: Activity },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-outline-variant/30 bg-surface-container-lowest">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-outline-variant/30">
        <span className="text-lg font-black tracking-tight text-primary">WhatsQuery OS</span>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav className="space-y-8">
          {navigation.map((section, idx) => (
            <div key={idx}>
              {section.items ? (
                <>
                  <h3 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {section.name}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
                            )}
                          >
                            <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-on-surface-variant/70")} />
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <ul className="space-y-1">
                  <li>
                    <Link
                      href={section.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname === section.href
                          ? "bg-primary/10 text-primary"
                          : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
                      )}
                    >
                      <section.icon className={cn("h-4 w-4", pathname === section.href ? "text-primary" : "text-on-surface-variant/70")} />
                      {section.name}
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-outline-variant/30">
        <form action={signOutAction}>
          <button type="submit" className="w-full text-left px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-xl transition-colors">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
