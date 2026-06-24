"use server";

import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { revalidatePath } from "next/cache";

/**
 * Retrieves all leads for the Sales Pipeline Kanban board.
 */
export async function getPipelineLeads() {
  await requirePlatformAdmin();
  return prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Updates a lead's stage in the Kanban board.
 */
export async function updateLeadStage(leadId: string, stage: string) {
  await requirePlatformAdmin();
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { status: stage },
  });
  revalidatePath("/voice/admin/sales/pipeline");
  return lead;
}

/**
 * Retrieves all organizations that are currently in Demo or Trial mode.
 */
export async function getDemoAccounts() {
  await requirePlatformAdmin();
  return prisma.organization.findMany({
    where: {
      tenantType: {
        in: ["DEMO", "TRIAL"],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Marks a demo account as WON and updates its type to PAID.
 */
export async function convertDemoToPaid(organizationId: string) {
  await requirePlatformAdmin();
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      tenantType: "PAID",
      lifecycleStatus: "active",
      accessStatus: "active",
    },
  });
  revalidatePath("/voice/admin/sales/demos");
  revalidatePath("/voice/admin/tenants");
  return org;
}
