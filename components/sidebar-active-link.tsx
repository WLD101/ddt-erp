"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarActiveLink({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = isActiveRoute(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 group",
        active
          ? "bg-primary text-white shadow-lg shadow-primary/20"
          : "text-on-surface-variant/70 hover:bg-primary/5 hover:text-primary"
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "material-symbols-outlined text-[20px] transition-transform group-hover:scale-110",
            active ? "fill-icon" : "opacity-60 group-hover:opacity-100"
          )}
        >
          {icon}
        </span>
        <span className="font-body-md whitespace-nowrap">{label}</span>
      </div>
      {badge !== undefined ? (
        <span
          className={cn(
            "text-[9px] font-black px-2 py-0.5 rounded-full min-w-[1.2rem] text-center shadow-sm",
            active ? "bg-white text-primary" : "bg-error text-white shadow-error/20"
          )}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
