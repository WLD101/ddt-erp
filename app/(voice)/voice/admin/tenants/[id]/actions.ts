"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignVoicePackage(organizationId: string, formData: FormData) {
  const packageId = formData.get("packageId") as string;
  const status = formData.get("status") as string;

  if (packageId) {
    await prisma.organizationPackage.upsert({
      where: { organizationId },
      update: { packageId },
      create: { organizationId, packageId }
    });

    await prisma.subscription.upsert({
      where: { organizationId },
      update: { status, manualPaymentMethod: "Voice Admin Override", billingSource: "manual" },
      create: { 
        organizationId, 
        status, 
        billingSource: "manual",
        manualPaymentMethod: "Voice Admin Override" 
      }
    });
  } else {
    await prisma.organizationPackage.deleteMany({ where: { organizationId } });
    await prisma.subscription.deleteMany({ where: { organizationId } });
  }

  revalidatePath(`/voice/admin/tenants/${organizationId}`);
  revalidatePath(`/voice/admin/tenants`);
}
