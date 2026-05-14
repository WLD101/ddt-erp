"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Server, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

import { PLATFORM_NAV_SECTIONS } from "./platform-nav";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-[1700px]">
        <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-outline-variant/20 bg-surface/90 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:flex xl:flex-col">
          <div className="rounded-[28px] border border-outline-variant/30 bg-linear-to-br from-surface via-surface to-surface-container-low p-6 shadow-soft">
            <div className="flex items-center gap-3 text-primary">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Platform Admin</p>
                <p className="text-lg font-black tracking-tight text-on-surface">WhatsQuery Authority</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium leading-6 text-on-surface-variant">
              Unified command center for customers, packages, approvals, and security posture.
            </p>
          </div>

          <nav className="mt-8 flex-1 space-y-6 overflow-y-auto pr-2">
            {PLATFORM_NAV_SECTIONS.map((section) => (
              <div key={section.label} className="space-y-2">
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/wq-command-center" && pathname.startsWith(`${item.href}/`));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all",
                          isActive
                            ? "bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(59,130,246,0.12)]"
                            : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-xs text-on-surface-variant shadow-sm">
            <p className="font-black uppercase tracking-[0.18em] text-on-surface">Restricted Zone</p>
            <p className="mt-2 leading-5">Platform-only controls. Tenant-facing billing and ERP workflows remain isolated.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-outline-variant/20 bg-surface/90 px-6 py-4 backdrop-blur xl:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">WhatsQuery Platform</p>
                <p className="text-sm font-medium text-on-surface-variant">Operational controls, growth signals, and secure tenant oversight.</p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface px-4 text-[11px] font-black uppercase tracking-[0.18em] text-on-surface shadow-soft transition-colors hover:bg-surface-container-low"
              >
                <Settings className="h-4 w-4" />
                Exit to App
              </Link>
            </div>
          </header>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
