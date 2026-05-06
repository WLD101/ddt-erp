"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { 
  Bell, CheckCheck, ExternalLink, AlertTriangle, 
  Info, ShieldAlert, Clock, CheckCircle2, Loader2, BellOff
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { getNotifications, markNotificationAsRead, markAllNotificationsRead } from "@/modules/notifications/actions";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  message: string;
  severity: string;
  type: string;
  actionUrl?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
};

// ─── Severity Styles ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<string, { icon: React.ReactElement; bg: string; dot: string; label: string }> = {
  CRITICAL: {
    icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    bg: "bg-rose-500/10 border-rose-500/20",
    dot: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]",
    label: "Critical",
  },
  WARNING: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]",
    label: "Warning",
  },
  SUCCESS: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]",
    label: "Success",
  },
  INFO: {
    icon: <Info className="w-4 h-4 text-blue-400" />,
    bg: "bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-500",
    label: "Info",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, startMarkAll] = useTransition();

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data as Notification[]);
    } catch {
      // Silent — bell should never throw
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Re-fetch when popover opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n));
    try {
      await markNotificationAsRead({ id });
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAll = () => {
    startMarkAll(async () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      try {
        await markAllNotificationsRead({});
      } catch {
        toast.error("Failed to mark all as read");
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 hover:bg-white/10 rounded-xl transition-all group"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          />
        }
      >
        <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 rounded-full bg-rose-500 text-[10px] font-black text-white border-2 border-slate-950 animate-in zoom-in duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        className="w-[400px] p-0 bg-slate-950/98 backdrop-blur-3xl border-white/5 shadow-[0_30px_70px_rgba(0,0,0,0.6)] rounded-[28px] overflow-hidden"
        align="end"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-white tracking-tight uppercase italic">Intelligence Desk</h4>
            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={isMarkingAll}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors disabled:opacity-40 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
            >
              {isMarkingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
              Dismiss All
            </button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="h-[380px]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {notifications.map((n) => {
                const sev = SEVERITY_CONFIG[n.severity] ?? SEVERITY_CONFIG.INFO;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "relative px-5 py-4 group hover:bg-white/[0.025] transition-all duration-200",
                      !n.isRead && "bg-white/[0.015]"
                    )}
                  >
                    {/* Unread left accent bar */}
                    {!n.isRead && (
                      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-primary shadow-[0_0_6px_rgba(124,58,237,0.6)]" />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Icon badge */}
                      <div className={cn("mt-0.5 p-1.5 rounded-xl border shrink-0", sev.bg)}>
                        {sev.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-[13px] font-bold text-white leading-snug truncate">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>

                        <div className="flex items-center justify-between pt-1.5">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", sev.dot)} />
                            {sev.label} &nbsp;•&nbsp;
                            <Clock className="w-2.5 h-2.5" />
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </div>
                          <div className="flex items-center gap-2">
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="text-[9px] font-black text-primary/70 hover:text-primary uppercase tracking-widest transition-colors"
                              >
                                Dismiss
                              </button>
                            )}
                            {n.actionUrl && (
                              <Link
                                href={n.actionUrl}
                                className="flex items-center gap-1 text-[9px] font-black text-muted-foreground hover:text-white uppercase tracking-widest bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg transition-all"
                                onClick={() => setOpen(false)}
                              >
                                Resolve <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-5 px-8">
              <div className="p-5 bg-white/[0.03] rounded-3xl border border-white/5">
                <BellOff className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-black text-white uppercase tracking-widest opacity-60">All Systems Nominal</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  No operational anomalies detected. Your organization is running smoothly.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <Link
            href="/notifications"
            className="text-[10px] font-black text-muted-foreground hover:text-white transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group"
            onClick={() => setOpen(false)}
          >
            Full History
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          {unreadCount > 0 && (
            <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[9px] font-black px-2 py-0.5">
              {unreadCount} Unread
            </Badge>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
