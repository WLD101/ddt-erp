"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

function isActiveRoute(pathname: string, href: string) {
  const cleanPath = pathname.startsWith("/voice") ? pathname.slice(6) || "/" : pathname;
  if (href === "/dashboard") {
    return cleanPath === "/dashboard" || cleanPath.startsWith("/dashboard/");
  }
  return cleanPath === href || cleanPath.startsWith(`${href}/`);
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
        "group flex items-center justify-between rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition-all duration-300",
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
        <span className="font-body-md whitespace-nowrap text-[0.78rem]">{label}</span>
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
