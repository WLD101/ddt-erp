"use server";

import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function getPartners() {
  await requirePlatformAdmin();
  return prisma.partner.findMany({
    include: {
      referrals: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPartner(data: {
  name: string;
  contactEmail: string;
  commissionRate?: number;
}) {
  await requirePlatformAdmin();

  // Generate a secure API Key for the partner
  const apiKey = "wq_pt_" + crypto.randomBytes(24).toString("hex");

  const partner = await prisma.partner.create({
    data: {
      name: data.name,
      contactEmail: data.contactEmail,
      apiKey,
      status: "ACTIVE",
      commissionRate: data.commissionRate ?? 20.0,
    },
  });

  revalidatePath("/voice/admin/partners");
  return partner;
}

export async function updatePartnerStatus(id: string, status: string) {
  await requirePlatformAdmin();
  const partner = await prisma.partner.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/voice/admin/partners");
  return partner;
}
