import type { ComponentType } from "react";

import {
  BarChart3,
  ContactRound,
  FileDown,
  FileSearch,
  KeyRound,
  Mail,
  PackageOpen,
  SearchCheck,
  Shield,
  Users,
  Waypoints,
} from "lucide-react";

export type PlatformNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type PlatformNavSection = {
  label: string;
  items: PlatformNavItem[];
};

export const PLATFORM_NAV_SECTIONS: PlatformNavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/wq-command-center", label: "Command Center", icon: BarChart3 },
      { href: "/platform/analytics", label: "Analytics", icon: Waypoints },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/platform/leads", label: "Demo Leads", icon: SearchCheck },
      { href: "/platform/emails", label: "Platform Emails", icon: Mail },
      { href: "/platform/new-client", label: "Add New Client", icon: ContactRound },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/platform/tenants", label: "Live Customers", icon: Users },
      { href: "/platform/exports", label: "Export Queue", icon: FileDown },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/platform/packages", label: "Package Catalog", icon: PackageOpen },
      { href: "/platform/catalog-limits", label: "Catalog Limits", icon: FileSearch },
    ],
  },
  {
    label: "Security",
    items: [
      { href: "/platform/vault", label: "System Vault", icon: KeyRound },
      { href: "/platform/audit", label: "Audit", icon: Shield },
      { href: "/platform/audit-log", label: "Audit Log", icon: Shield },
    ],
  },
];
