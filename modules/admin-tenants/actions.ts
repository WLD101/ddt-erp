"use server";

import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { revalidatePath } from "next/cache";

export async function getTenants(params?: { search?: string; type?: string }) {
  await requirePlatformAdmin();
  
  const where: any = {};
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { slug: { contains: params.search, mode: "insensitive" } },
    ];
  }
  
  if (params?.type && params.type !== "ALL") {
    where.tenantType = params.type;
  }

  return prisma.organization.findMany({
    where,
    include: {
      voiceUsageMeter: true,
      subscription: true,
      _count: {
        select: { voiceAgents: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTenantById(id: string) {
  await requirePlatformAdmin();
  
  return prisma.organization.findUnique({
    where: { id },
    include: {
      voiceUsageMeter: true,
      subscription: true,
      voiceAgents: true,
      callLogs: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      users: {
        include: { user: true }
      }
    }
  });
}

export async function updateTenantStatus(id: string, accessStatus: string, lifecycleStatus: string) {
  await requirePlatformAdmin();
  
  const org = await prisma.organization.update({
    where: { id },
    data: { accessStatus, lifecycleStatus },
  });
  
  revalidatePath("/voice/admin/tenants");
  revalidatePath(`/voice/admin/tenants/${id}`);
  return org;
}
