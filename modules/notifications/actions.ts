"use server";

import { createServerAction } from "@/lib/actions/builder";
import * as service from "./service";
import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { z } from "zod";

// ─── FETCH ────────────────────────────────────────────────────────────────────

export async function getNotifications(filters?: {
  isRead?: boolean;
  severity?: string;
  type?: string;
}) {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getNotifications(db, ctx.userId, filters);
}

export async function getUnreadCount(): Promise<number> {
  try {
    const ctx = await getCurrentTenantContext();
    const db = getTenantStore(ctx);
    return service.getUnreadCount(db, ctx.userId);
  } catch {
    return 0;
  }
}

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

/**
 * ACTION: MARK SINGLE NOTIFICATION AS READ
 */
export const markNotificationAsRead = createServerAction({
  label: "MarkNotificationAsRead",
  schema: z.object({ id: z.string() }),
  revalidatePaths: ["/", "/notifications"],
  handler: async ({ input, context }) => {
    return service.markAsRead(context.db, input.id);
  },
});

/**
 * ACTION: MARK ALL NOTIFICATIONS AS READ
 */
export const markAllNotificationsRead = createServerAction({
  label: "MarkAllNotificationsRead",
  schema: z.object({}),
  revalidatePaths: ["/", "/notifications"],
  handler: async ({ input, context }) => {
    return service.markAllAsRead(context.db, context.ctx.userId);
  },
});

/**
 * ACTION: DELETE A NOTIFICATION
 */
export const deleteNotification = createServerAction({
  label: "DeleteNotification",
  blockInDemoMode: true,
  schema: z.object({ id: z.string() }),
  revalidatePaths: ["/notifications"],
  handler: async ({ input, context }) => {
    return service.deleteNotification(context.db, input.id);
  },
});

// ─── OPERATIONAL PULSE ───────────────────────────────────────────────────────
/**
 * Fires the full operational alert scanner.
 * Safe to call from dashboard load, admin trigger routes, or future cron jobs.
 */
export async function triggerNotificationPulse() {
  try {
    const ctx = await getCurrentTenantContext();
    const db = getTenantStore(ctx);
    return service.syncOperationalAlerts(db);
  } catch {
    // Silent failure — pulse should never crash page load
  }
}
