"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignPackageAction(formData: FormData) {
  const organizationId = formData.get("organizationId") as string;
  const packageId = formData.get("packageId") as string;

  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  if (packageId) {
    await prisma.organizationPackage.upsert({
      where: { organizationId },
      update: { packageId },
      create: { organizationId, packageId }
    });

    await prisma.subscription.upsert({
      where: { organizationId },
      update: { 
        status: "active", 
        paymentStatus: "paid", 
        manualPaymentMethod: "Voice Command Center Assign", 
        billingSource: "manual" 
      },
      create: { 
        organizationId, 
        status: "active", 
        paymentStatus: "paid",
        billingSource: "manual",
        manualPaymentMethod: "Voice Command Center Assign",
        planId: "voice-manual",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await prisma.organization.update({
      where: { id: organizationId },
      data: { 
        accessStatus: "active", 
        lifecycleStatus: "active" 
      }
    });
  } else {
    await prisma.organizationPackage.deleteMany({ where: { organizationId } });
    await prisma.subscription.deleteMany({ where: { organizationId } });
    await prisma.organization.update({
      where: { id: organizationId },
      data: { 
        accessStatus: "inactive", 
        lifecycleStatus: "onboarding" 
      }
    });
  }

  revalidatePath("/voice/admin/command-center");
  revalidatePath("/voice/admin/tenants");
}

export async function approveManualPaymentAction(formData: FormData) {
  const organizationId = formData.get("organizationId") as string;
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: "active",
      paymentStatus: "paid",
      accessStatus: "active"
    }
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      accessStatus: "active",
      lifecycleStatus: "active"
    }
  });

  revalidatePath("/voice/admin/command-center");
  revalidatePath("/voice/admin/tenants");
}

export async function rejectManualPaymentAction(formData: FormData) {
  const organizationId = formData.get("organizationId") as string;
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: "failed",
      paymentStatus: "failed",
      accessStatus: "blocked"
    }
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      accessStatus: "blocked",
      lifecycleStatus: "blocked"
    }
  });

  revalidatePath("/voice/admin/command-center");
  revalidatePath("/voice/admin/tenants");
}
