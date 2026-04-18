"use client";

import { useState, useTransition, useMemo } from "react";
import { 
  Bell, BellOff, CheckCheck, ShieldAlert, AlertTriangle, 
  CheckCircle2, Info, ExternalLink, Trash2, Clock, Filter,
  XCircle, Loader2
} from "lucide-react";
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
const SEV_CONFIG: Record<string, { icon: JSX.Element; bg: string; border: string; text: string; dot: string; label: string }> = {
  CRITICAL: {
    icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    dot: "bg-rose-500",
    label: "Critical",
  },
  WARNING: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    dot: "bg-amber-500",
    label: "Warning",
  },
  SUCCESS: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
    label: "Success",
  },
  INFO: {
    icon: <Info className="w-5 h-5 text-blue-400" />,
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    dot: "bg-blue-400",
    label: "Info",
  },
};

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200",
        active
          ? "bg-primary text-white shadow-[0_0_14px_rgba(124,58,237,0.4)]"
          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5"
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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ── Filtered view ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filterRead === "unread" && n.isRead) return false;
      if (filterRead === "read" && !n.isRead) return false;
      if (filterSeverity !== "all" && n.severity !== filterSeverity) return false;
      return true;
    });
  }, [notifications, filterRead, filterSeverity]);

  // ── Actions ────────────────────────────────────────────────────────────────
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
    setDeletingIds(prev => new Set(prev).add(id));
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
        <div className="flex items-center gap-4">
          {/* Counts */}
          <div className="flex items-center gap-3">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total</p>
                <p className="text-xl font-black text-white italic">{notifications.length}</p>
              </div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-3 flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <div>
                <p className="text-[9px] font-black text-rose-400/70 uppercase tracking-widest">Unread</p>
                <p className="text-xl font-black text-rose-400 italic">{unreadCount}</p>
              </div>
            </div>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAll}
            disabled={isMarkingAll}
            variant="outline"
            className="h-12 px-6 bg-white/5 border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
          >
            {isMarkingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCheck className="w-4 h-4 mr-2" />}
            Dismiss All Unread
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Filter by Status</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "unread", "read"] as const).map(f => (
            <FilterChip key={f} label={f} active={filterRead === f} onClick={() => setFilterRead(f)} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Filter by Severity</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "CRITICAL", "WARNING", "INFO", "SUCCESS"].map(s => (
            <FilterChip key={s} label={s} active={filterSeverity === s} onClick={() => setFilterSeverity(s)} />
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-[32px] border border-white/5 bg-white/[0.02] space-y-5">
            <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
              <BellOff className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-white uppercase tracking-widest opacity-40">No Alerts Found</p>
              <p className="text-xs text-muted-foreground">
                {notifications.length > 0 ? "Try adjusting your filters." : "Your organization is operating smoothly."}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((n) => {
            const sev = SEV_CONFIG[n.severity] ?? SEV_CONFIG.INFO;
            return (
              <div
                key={n.id}
                className={cn(
                  "relative group rounded-[24px] border p-6 transition-all duration-300 hover:border-white/10",
                  n.isRead
                    ? "bg-white/[0.015] border-white/5 opacity-70 hover:opacity-100"
                    : `${sev.bg} ${sev.border}`
                )}
              >
                {/* Unread left bar */}
                {!n.isRead && (
                  <div className={cn("absolute left-0 top-5 bottom-5 w-1 rounded-r-full", sev.dot)} />
                )}

                <div className="flex items-start gap-5">
                  {/* Icon */}
                  <div className={cn("p-3 rounded-2xl border shrink-0 mt-0.5", sev.bg, sev.border)}>
                    {sev.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-white leading-snug">{n.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border", sev.bg, sev.border, sev.text)}>
                            {sev.label}
                          </Badge>
                          {n.entityType && (
                            <Badge className="bg-white/5 text-white/30 border-white/5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                              {n.entityType}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary text-muted-foreground transition-all"
                            title="Mark as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-muted-foreground transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[13px] text-muted-foreground leading-relaxed">{n.message}</p>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        {n.isRead && n.readAt && (
                          <span className="ml-1">
                            &nbsp;•&nbsp; Read {format(new Date(n.readAt), "MMM dd")}
                          </span>
                        )}
                      </div>
                      {n.actionUrl && (
                        <Link
                          href={n.actionUrl}
                          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white px-3 py-1.5 rounded-xl transition-all"
                        >
                          View Details <ExternalLink className="w-3 h-3 ml-0.5" />
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
