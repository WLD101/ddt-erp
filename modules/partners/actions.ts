"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Retrieves the current user's partner profile and stats.
 */
export async function getPartnerStats() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin");

  const partner = await prisma.partner.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      referrals: {
        include: {
          referredOrg: {
            include: {
              subscription: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!partner) return null;

  // Calculate metrics
  const totalReferrals = partner.referrals.length;
  const activeSubs = partner.referrals.filter(r => r.referredOrg?.subscription?.status === "active").length;
  const trials = totalReferrals - activeSubs;
  
  const conversionRate = totalReferrals > 0 ? (activeSubs / totalReferrals) * 100 : 0;
  
  // Future: Calculate actual revenue share from payments
  const estimatedRevenueShare = partner.referrals.reduce((acc, curr) => {
    if (curr.referredOrg?.subscription?.status === "active") {
        return acc + (100 * partner.commissionRate);
    }
    return acc;
  }, 0);

  const pipelineValue = trials * (100 * partner.commissionRate);

  // Growth Trend (Mocked for existing data, but structured correctly for Recharts)
  // In production, this would be computed via group-by on createdAt
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const trendData = months.map((month, i) => ({
    month,
    referrals: Math.round(totalReferrals * (0.1 + (i * 0.15))),
    revenue: Math.round(estimatedRevenueShare * (0.1 + (i * 0.12)))
  }));

  return {
    partner,
    metrics: {
      totalReferrals,
      activeSubs,
      trials,
      conversionRate,
      estimatedRevenueShare,
      pipelineValue
    },
    trendData
  };
}

/**
 * Onboards the current user as a partner (v1 auto-onboarding).
 */
export async function joinPartnerProgram() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existing = await prisma.partner.findUnique({
        where: { userId: session.user.id }
    });

    if (existing) return existing;

    // Generate a simple unique partner code
    const baseCode = session.user.name?.split(" ")[0].toUpperCase() || "REF";
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const partnerCode = `${baseCode}${randomSuffix}`;

    return prisma.partner.create({
        data: {
            userId: session.user.id,
            partnerCode,
            status: "ACTIVE",
            commissionRate: 0.15 // 15% promotional rate
        }
    });
}
