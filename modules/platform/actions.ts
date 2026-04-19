"use server";

import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/billing/plans";

/**
 * Retrieves macro analytics for the entire platform.
 * Bypasses all multi-tenant constraints implicitly.
 */
export async function getPlatformOverview() {
  const [
    totalTenants,
    totalUsers,
    totalDemos,
    subscriptions
  ] = await Promise.all([
    prisma.organization.count({ where: { isDemoTenant: false } }),
    prisma.user.count({ where: { isDemoUser: false } }),
    prisma.organization.count({ where: { isDemoTenant: true } }),
    prisma.subscription.findMany({
      include: { organization: { select: { id: true, name: true, createdAt: true } } }
    })
  ]);

  // Aggregate Subscription KPIs
  let activeTrials = 0;
  let expiredTrials = 0;
  let activePaid = 0;
  let estimatedMRR = 0;

  const now = new Date();

  // Sort sub timeline to see recent signups
  const recentSignups = subscriptions
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  subscriptions.forEach(sub => {
    const plan = PLANS[sub.planId];
    if (!plan) return;

    if (sub.status === "trialing") {
      if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) {
        expiredTrials++;
      } else {
        activeTrials++;
      }
    } else if (sub.status === "active") {
      activePaid++;
      estimatedMRR += plan.price.monthly || 0; // Extremely rough estimate for v1
    }
  });

  return {
    metrics: {
      totalTenants,
      totalUsers,
      totalDemos,
      activeTrials,
      expiredTrials,
      activePaid,
      estimatedMRR
    },
    recentSignups
  };
}


/**
 * Retrieves specific multi-tenant global directory.
 */
export async function getPlatformTenants() {
  const tenants = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: true,
      _count: {
        select: { memberships: true, branches: true, products: true, salesInvoices: true }
      }
    }
  });

  return tenants;
}

/**
 * Retrieves recent audit logs across all organizations.
 */
export async function getGlobalAuditLogs() {
  const logs = await prisma.auditLog.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      organization: { select: { name: true } }
    }
  });

  return logs;
}

/**
 * Retrieves system health metrics based on database record counts.
 */
export async function getSystemHealth() {
  const [
    invoices,
    products,
    movements,
    notifications
  ] = await Promise.all([
    prisma.salesInvoice.count(),
    prisma.product.count(),
    prisma.stockMovement.count(),
    prisma.notification.count()
  ]);

  return {
    invoices,
    products,
    movements,
    notifications,
    status: "HEALTHY" // Placeholder for real health checks
  };
}
