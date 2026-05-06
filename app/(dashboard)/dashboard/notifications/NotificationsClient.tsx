"use client";

import * as React from "react";
import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  actionUrl?: string | null;
  entityType?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
};

type Props = {
  initialNotifications: Notification[];
  markAsReadAction: (input: { id: string }) => Promise<any>;
  markAllReadAction: (input: {}) => Promise<any>;
  deleteAction: (input: { id: string }) => Promise<any>;
};

// ─── Severity Config ──────────────────────────────────────────────────────────
const SEV_CONFIG: Record<string, { icon: string; bg: string; border: string; text: string; dot: string; label: string }> = {
  CRITICAL: {
    icon: "shield_alert",
    bg: "bg-error/10",
    border: "border-error/20",
    text: "text-error",
    dot: "bg-error",
    label: "Critical",
  },
  WARNING: {
    icon: "warning",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-600",
    dot: "bg-amber-500",
    label: "Warning",
  },
  SUCCESS: {
    icon: "check_circle",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
    text: "text-secondary",
    dot: "bg-secondary",
    label: "Success",
  },
  INFO: {
    icon: "info",
    bg: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary",
    dot: "bg-primary",
    label: "Info",
  },
};

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 border",
        active
          ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20"
          : "bg-surface text-on-surface-variant hover:bg-surface border-outline-variant/30"
      )}
    >
      {label}
    </button>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────
export function NotificationsClient({ initialNotifications, markAsReadAction, markAllReadAction, deleteAction }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [isMarkingAll, startMarkAll] = useTransition();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filterRead === "unread" && n.isRead) return false;
      if (filterRead === "read" && !n.isRead) return false;
      if (filterSeverity !== "all" && n.severity !== filterSeverity) return false;
      return true;
    });
  }, [notifications, filterRead, filterSeverity]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n));
    try {
      await markAsReadAction({ id });
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleMarkAll = () => {
    startMarkAll(async () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      try {
        await markAllReadAction({});
        toast.success("All notifications dismissed");
      } catch {
        toast.error("Failed to dismiss all");
      }
    });
  };

  const handleDelete = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteAction({ id });
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary + Mark All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-soft">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">inbox</span>
            <div>
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Total Alerts</p>
              <p className="text-xl font-black text-on-surface tracking-tighter">{notifications.length}</p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-soft">
            <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest">Pending</p>
              <p className="text-xl font-black text-primary tracking-tighter">{unreadCount}</p>
            </div>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAll}
            disabled={isMarkingAll}
            className="h-11 px-8"
          >
            {isMarkingAll ? (
              <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined mr-2">done_all</span>
            )}
            Dismiss All
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-surface rounded-3xl border border-outline-variant/30 shadow-soft">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            Status Triage
          </p>
          <div className="flex flex-wrap gap-2">
            {(["all", "unread", "read"] as const).map(f => (
              <FilterChip key={f} label={f} active={filterRead === f} onClick={() => setFilterRead(f)} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">priority_high</span>
            Severity Matrix
          </p>
          <div className="flex flex-wrap gap-2">
            {["all", "CRITICAL", "WARNING", "INFO", "SUCCESS"].map(s => (
              <FilterChip key={s} label={s} active={filterSeverity === s} onClick={() => setFilterSeverity(s)} />
            ))}
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
            <div className="w-16 h-16 rounded-3xl bg-surface-container-low flex items-center justify-center text-on-surface-variant/30 mb-4">
              <span className="material-symbols-outlined text-4xl">notifications_off</span>
            </div>
            <h4 className="text-sm font-black text-on-surface uppercase tracking-widest">Workspace Silence</h4>
            <p className="text-xs text-on-surface-variant font-medium mt-2 max-w-xs mx-auto italic">
              {notifications.length > 0 ? "Adjust filters to reveal archived logs." : "Operational telemetry is clear."}
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const sev = SEV_CONFIG[n.severity] ?? SEV_CONFIG.INFO;
            return (
              <div
                key={n.id}
                className={cn(
                  "relative group rounded-3xl border p-6 transition-all duration-300 hover:shadow-lg",
                  n.isRead
                    ? "bg-surface-container-lowest border-outline-variant/20 opacity-60 hover:opacity-100"
                    : `bg-surface shadow-soft ${sev.border}`
                )}
              >
                {!n.isRead && (
                  <div className={cn("absolute left-0 top-6 bottom-6 w-1 rounded-r-full shadow-sm", sev.dot)} />
                )}

                <div className="flex items-start gap-5">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 mt-0.5", sev.bg, sev.border)}>
                    <span className={cn("material-symbols-outlined", sev.text)}>{sev.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-on-surface tracking-tight leading-tight">{n.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", sev.bg, sev.text, "border-none")}>
                            {sev.label}
                          </Badge>
                          {n.entityType && (
                            <Badge className="bg-surface-container-low text-on-surface-variant/60 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                              {n.entityType}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-primary/10 hover:text-primary text-on-surface-variant transition-all"
                          >
                            <span className="material-symbols-outlined text-[20px]">done</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-error/10 hover:text-error text-on-surface-variant transition-all"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-on-surface-variant leading-relaxed mb-4">{n.message}</p>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        {n.isRead && n.readAt && (
                          <span className="opacity-60">• Read {format(new Date(n.readAt), "MMM dd")}</span>
                        )}
                      </div>
                      {n.actionUrl && (
                        <Link
                          href={n.actionUrl}
                          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-primary text-on-primary px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/20 hover:opacity-90"
                        >
                          Investigate <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

