import { ScopedPrisma } from "@/lib/db/client";
import { syncLifecycleMilestones } from "../emails/service";

// ─── Notification Type Catalogue ────────────────────────────────────────────
// Each type maps to a visual treatment and a permission gate.
export const NotificationType = {
  LOW_STOCK:           "LOW_STOCK",
  OVERDUE_RECEIVABLE:  "OVERDUE_RECEIVABLE",
  OVERDUE_PAYABLE:     "OVERDUE_PAYABLE",
  QUOTATION_EXPIRED:   "QUOTATION_EXPIRED",
  QUOTATION_ACCEPTED:  "QUOTATION_ACCEPTED",
  SUBSCRIPTION_EXPIRY: "SUBSCRIPTION_EXPIRY",
  SUBSCRIPTION_PAST_DUE: "SUBSCRIPTION_PAST_DUE",
  SUBSCRIPTION_RENEWED:  "SUBSCRIPTION_RENEWED",
  LARGE_RETURN:        "LARGE_RETURN",
  SYSTEM:              "SYSTEM",
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// ─── Severity levels for visual treatment ────────────────────────────────────
export const Severity = {
  INFO:     "INFO",
  WARNING:  "WARNING",
  CRITICAL: "CRITICAL",
  SUCCESS:  "SUCCESS",
} as const;
export type Severity = typeof Severity[keyof typeof Severity];

// ─── Permission gates per notification type ───────────────────────────────────
// Users who lack these permissions will not receive these notification types.
export const NOTIFICATION_PERMISSION_GATES: Partial<Record<NotificationType, string>> = {
  [NotificationType.OVERDUE_RECEIVABLE]:  "finances.view",
  [NotificationType.OVERDUE_PAYABLE]:     "finances.view",
  [NotificationType.SUBSCRIPTION_EXPIRY]: "billing.manage",
  [NotificationType.SUBSCRIPTION_PAST_DUE]: "billing.manage",
  [NotificationType.SUBSCRIPTION_RENEWED]:  "billing.manage",
};

// ─── Core create helper ────────────────────────────────────────────────────────
export async function createNotification(db: ScopedPrisma, data: {
  userId?: string;
  type: NotificationType;
  severity?: Severity;
  title: string;
  message: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  deduplicateKey?: string; // If provided, skips creation if an unread one exists with same type + key
}) {
  // Idempotency: prevent duplicate unread alerts for the same event
  if (data.deduplicateKey) {
    const existing = await db.notification.findFirst({
      where: {
        organizationId: db.organizationId,
        type: data.type,
        entityId: data.deduplicateKey,
        isRead: false,
      },
    });
    if (existing) return existing;
  }

  return db.notification.create({
    data: {
      organizationId: db.organizationId,
      userId: data.userId ?? null,
      type: data.type,
      severity: data.severity ?? Severity.INFO,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      entityType: data.entityType,
      entityId: data.entityId ?? data.deduplicateKey,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      isRead: false,
    },
  });
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
export async function getNotifications(
  db: ScopedPrisma,
  userId: string,
  filters?: { isRead?: boolean; severity?: string; type?: string }
) {
  return db.notification.findMany({
    where: {
      organizationId: db.organizationId,
      OR: [{ userId: null }, { userId }],
      ...(filters?.isRead !== undefined ? { isRead: filters.isRead } : {}),
      ...(filters?.severity ? { severity: filters.severity } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getUnreadCount(db: ScopedPrisma, userId: string): Promise<number> {
  return db.notification.count({
    where: {
      organizationId: db.organizationId,
      isRead: false,
      OR: [{ userId: null }, { userId }],
    },
  });
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────
export async function markAsRead(db: ScopedPrisma, id: string) {
  return db.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(db: ScopedPrisma, userId: string) {
  return db.notification.updateMany({
    where: {
      organizationId: db.organizationId,
      isRead: false,
      OR: [{ userId: null }, { userId }],
    },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function deleteNotification(db: ScopedPrisma, id: string) {
  return db.notification.delete({ where: { id } });
}

// ─── OPERATIONAL PULSE ────────────────────────────────────────────────────────
/**
 * Scans the full organization for operational anomalies and generates
 * actionable notifications. Safe to run frequently (idempotent via dedup key).
 * Designed to run from dashboard load or a cron-style background job.
 */
export async function syncOperationalAlerts(db: ScopedPrisma) {
  const now = new Date();
  
  await Promise.allSettled([
    _checkLowStock(db),
    _checkOverdueSales(db, now),
    _checkOverduePurchases(db, now),
    _checkSubscriptionHealth(db, now),
    _checkExpiredQuotations(db, now),
    syncLifecycleMilestones(),
  ]);
}

// ─── Low Stock ────────────────────────────────────────────────────────────────
async function _checkLowStock(db: ScopedPrisma) {
  const items = await db.inventoryItem.findMany({
    where: { quantity: { lte: 10 } },
    include: { product: true, branch: true },
  });

  for (const item of items) {
    const threshold = item.product.lowStockThreshold ?? 5;
    if (item.quantity <= threshold) {
      await createNotification(db, {
        type: NotificationType.LOW_STOCK,
        severity: item.quantity === 0 ? Severity.CRITICAL : Severity.WARNING,
        title: "Low Inventory Alert",
        message: `${item.product.name} is critically low at ${item.branch.name}: only ${item.quantity} unit(s) remaining.`,
        actionUrl: "/inventory",
        entityType: "InventoryItem",
        deduplicateKey: item.id,
      });
    }
  }
}

// ─── Overdue Sales ────────────────────────────────────────────────────────────
async function _checkOverdueSales(db: ScopedPrisma, now: Date) {
  const overdue = await db.salesInvoice.findMany({
    where: { status: { notIn: ["PAID"] }, dueDate: { lt: now } },
    include: { customer: true },
  });

  for (const inv of overdue) {
    await createNotification(db, {
      type: NotificationType.OVERDUE_RECEIVABLE,
      severity: Severity.CRITICAL,
      title: "Overdue Customer Receivable",
      message: `Invoice ${inv.invoiceNumber} for ${inv.customer.name} ($${inv.totalAmount.toFixed(2)}) is past its due date.`,
      actionUrl: `/sales/${inv.id}`,
      entityType: "SalesInvoice",
      deduplicateKey: inv.id,
    });
  }
}

// ─── Overdue Purchases ────────────────────────────────────────────────────────
async function _checkOverduePurchases(db: ScopedPrisma, now: Date) {
  const overdue = await db.purchaseInvoice.findMany({
    where: { status: { notIn: ["PAID"] }, dueDate: { lt: now } },
    include: { supplier: true },
  });

  for (const inv of overdue) {
    await createNotification(db, {
      type: NotificationType.OVERDUE_PAYABLE,
      severity: Severity.CRITICAL,
      title: "Overdue Supplier Payable",
      message: `Procurement bill ${inv.invoiceNumber} from ${inv.supplier.name} ($${inv.totalAmount.toFixed(2)}) is overdue.`,
      actionUrl: `/purchases/${inv.id}`,
      entityType: "PurchaseInvoice",
      deduplicateKey: inv.id,
    });
  }
}

// ─── Subscription Health ──────────────────────────────────────────────────────
async function _checkSubscriptionHealth(db: ScopedPrisma, now: Date) {
  const sub = await db.subscription.findFirst();
  if (!sub) return;

  if (sub.status === "past_due") {
    await createNotification(db, {
      type: NotificationType.SUBSCRIPTION_PAST_DUE,
      severity: Severity.CRITICAL,
      title: "Subscription Payment Failed",
      message: "Your organization's subscription payment could not be processed. Update your billing details to avoid service interruption.",
      actionUrl: "/settings/billing",
      entityType: "Subscription",
      deduplicateKey: `${sub.id}-past_due`,
    });
  }

  // Warn 7 days before expiry
  if (sub.currentPeriodEnd) {
    const daysLeft = Math.ceil((new Date(sub.currentPeriodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 7) {
      await createNotification(db, {
        type: NotificationType.SUBSCRIPTION_EXPIRY,
        severity: Severity.WARNING,
        title: `Subscription Expiring in ${daysLeft} Day(s)`,
        message: `Your ${sub.planId} plan renews on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}. Review your billing settings to stay uninterrupted.`,
        actionUrl: "/settings/billing",
        entityType: "Subscription",
        deduplicateKey: `${sub.id}-expiry-${daysLeft}`,
      });
    }
  }
}

// ─── Expired Quotations ───────────────────────────────────────────────────────
async function _checkExpiredQuotations(db: ScopedPrisma, now: Date) {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const expiredQuotes = await db.quotation.findMany({
    where: {
      status: { notIn: ["CONVERTED", "REJECTED", "EXPIRED"] },
      createdAt: { lt: thirtyDaysAgo },
    },
    include: { customer: true },
  });

  for (const quote of expiredQuotes) {
    // Mark the quotation as expired in-place
    await db.quotation.update({
      where: { id: quote.id },
      data: { status: "EXPIRED" },
    });

    await createNotification(db, {
      type: NotificationType.QUOTATION_EXPIRED,
      severity: Severity.WARNING,
      title: "Proposal Expired",
      message: `Quotation ${quote.id} for ${quote.customer.name} ($${quote.totalAmount.toFixed(2)}) has expired without acceptance.`,
      actionUrl: `/sales/quotes/${quote.id}`,
      entityType: "Quotation",
      deduplicateKey: `${quote.id}-expired`,
    });
  }
}

// ─── Targeted Event Triggers (used by other modules) ─────────────────────────

/** Called after a sale is created to immediately check stock levels. */
export async function notifyLowStockForProduct(db: ScopedPrisma, productId: string, branchId: string) {
  const item = await db.inventoryItem.findUnique({
    where: { organizationId_branchId_productId: { organizationId: db.organizationId, branchId, productId } },
    include: { product: true, branch: true },
  });
  if (!item) return;

  const threshold = item.product.lowStockThreshold ?? 5;
  if (item.quantity <= threshold) {
    await createNotification(db, {
      type: NotificationType.LOW_STOCK,
      severity: item.quantity === 0 ? Severity.CRITICAL : Severity.WARNING,
      title: "Low Inventory Alert",
      message: `${item.product.name} dropped to ${item.quantity} unit(s) at ${item.branch.name}.`,
      actionUrl: "/inventory",
      entityType: "InventoryItem",
      deduplicateKey: item.id,
    });
  }
}

/** Called when a large return is processed. */
export async function notifyLargeReturn(db: ScopedPrisma, data: {
  returnNumber: string;
  amount: number;
  entityType: "SalesReturn" | "PurchaseReturn";
  entityId: string;
  actionUrl: string;
}) {
  const LARGE_RETURN_THRESHOLD = 5000;
  if (data.amount < LARGE_RETURN_THRESHOLD) return;

  await createNotification(db, {
    type: NotificationType.LARGE_RETURN,
    severity: Severity.WARNING,
    title: "Large Return Processed",
    message: `${data.returnNumber}: A high-value return of $${data.amount.toFixed(2)} was submitted and requires review.`,
    actionUrl: data.actionUrl,
    entityType: data.entityType,
    entityId: data.entityId,
  });
}
