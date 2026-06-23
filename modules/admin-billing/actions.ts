"use server";

import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { revalidatePath } from "next/cache";

export async function getCostLedgerStats() {
  await requirePlatformAdmin();
  
  // For MVP, we will query all entries. In prod, this should aggregate by month or date range.
  const ledgers = await prisma.costLedger.findMany();
  
  let totalProviderCost = 0;
  let totalTenantBilled = 0;

  ledgers.forEach(l => {
    totalProviderCost += Number(l.amount || 0);
    // Assuming 50% margin for simple presentation if we only track cost.
    totalTenantBilled += Number(l.amount || 0) * 1.5; 
  });

  const grossProfit = totalTenantBilled - totalProviderCost;
  const profitMargin = totalTenantBilled > 0 ? (grossProfit / totalTenantBilled) * 100 : 0;

  return {
    totalProviderCost,
    totalTenantBilled,
    grossProfit,
    profitMargin,
    recentEntries: await prisma.costLedger.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
    })
  };
}
