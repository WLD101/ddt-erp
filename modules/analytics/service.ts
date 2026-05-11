/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { prisma } from "@/lib/prisma";

export const AnalyticCategory = {
    AUTH: "AUTH",
    ONBOARDING: "ONBOARDING",
    INVENTORY: "INVENTORY",
    SALES: "SALES",
    PURCHASES: "PURCHASES",
    FINANCES: "FINANCES",
    BILLING: "BILLING",
} as const;

export type AnalyticCategory = typeof AnalyticCategory[keyof typeof AnalyticCategory];

/**
 * CORE: Track an internal product usage event.
 * Dispatched asynchronously to prevent blocking the main transaction.
 */
export async function trackEvent(data: {
    name: string;
    category: AnalyticCategory;
    userId?: string;
    organizationId?: string | null;
    properties?: Record<string, any>;
}) {
    // Non-blocking fire-and-forget (handled by Vercel/Next.js after response)
    // In production with high volume, this would go to a queue.
    void prisma.analyticsEvent.create({
        data: {
            name: data.name,
            category: data.category,
            userId: data.userId,
            organizationId: data.organizationId,
        }
    }).catch(err => console.error("[Analytics Error] Failed to log event:", err));
}

/**
 * FETCH: Activation Funnel Metrics
 */
export async function getActivationFunnel() {
    const counts = await prisma.$transaction([
        prisma.analyticsEvent.count({ where: { name: "SIGNUP_COMPLETED" } }),
        prisma.analyticsEvent.count({ where: { name: "ONBOARDING_COMPLETED" } }),
        prisma.analyticsEvent.count({ where: { name: "PRODUCT_CREATED" } }),
        prisma.analyticsEvent.count({ where: { name: "SALE_CREATED" } }),
    ]);

    const labels = ["Signup", "Onboarding", "Inventory", "First Sale"];
    return labels.map((label, i) => ({
        stage: label,
        count: counts[i],
        // Percentage relative to signup
        percentage: counts[0] > 0 ? (counts[i] / counts[0]) * 100 : 0
    }));
}

/**
 * FETCH: Feature Usage distribution
 */
export async function getFeatureUsage() {
    const raw = await prisma.analyticsEvent.groupBy({
        by: ['category'],
        _count: { _all: true },
        where: { category: { not: "AUTH" } },
        orderBy: { _count: { id: 'desc' } }
    });

    return raw.map(item => ({
        category: item.category,
        count: item._count._all
    }));
}

/**
 * FETCH: Daily Active Organizations (Retention proxy)
 */
export async function getDailyActiveOrgs() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Simplistic unique org count per day
    const events = await prisma.analyticsEvent.findMany({
        where: { timestamp: { gte: sevenDaysAgo }, organizationId: { not: null } },
        select: { timestamp: true, organizationId: true }
    });

    const dailyMap = new Map<string, Set<string>>();
    events.forEach(e => {
        const date = e.timestamp.toISOString().split('T')[0];
        if (!dailyMap.has(date)) dailyMap.set(date, new Set());
        dailyMap.get(date)!.add(e.organizationId!);
    });

    return Array.from(dailyMap.entries()).map(([date, orgs]) => ({
        date,
        count: orgs.size
    })).sort((a, b) => a.date.localeCompare(b.date));
}
