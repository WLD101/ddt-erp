"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createVoicePackageAction(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const monthlyPrice = Number(formData.get("monthlyPrice"));
  const originalMonthlyPrice = formData.get("originalMonthlyPrice") ? Number(formData.get("originalMonthlyPrice")) : undefined;
  const trialDays = formData.get("trialDays") ? Number(formData.get("trialDays")) : undefined;

  const maxAgents = formData.get("maxAgents") ? Number(formData.get("maxAgents")) : undefined;
  const maxPhoneNumbers = formData.get("maxPhoneNumbers") ? Number(formData.get("maxPhoneNumbers")) : undefined;
  const maxMonthlyCalls = formData.get("maxMonthlyCalls") ? Number(formData.get("maxMonthlyCalls")) : undefined;
  const maxMonthlyMinutes = formData.get("maxMonthlyMinutes") ? Number(formData.get("maxMonthlyMinutes")) : undefined;
  const maxConcurrentCalls = formData.get("maxConcurrentCalls") ? Number(formData.get("maxConcurrentCalls")) : undefined;
  const maxLeadsPerMonth = formData.get("maxLeadsPerMonth") ? Number(formData.get("maxLeadsPerMonth")) : undefined;
  const maxReservationRequestsPerMonth = formData.get("maxReservationRequestsPerMonth") ? Number(formData.get("maxReservationRequestsPerMonth")) : undefined;
  const maxOrderRequestsPerMonth = formData.get("maxOrderRequestsPerMonth") ? Number(formData.get("maxOrderRequestsPerMonth")) : undefined;
  const supportsForwarding = formData.get("supportsForwarding") === "on";
  const includesVapiPhoneNumber = formData.get("includesVapiPhoneNumber") === "on";
  const prioritySupport = formData.get("prioritySupport") === "on";
  const recordingRetentionDays = formData.get("recordingRetentionDays") ? Number(formData.get("recordingRetentionDays")) : undefined;
  const transcriptRetentionDays = formData.get("transcriptRetentionDays") ? Number(formData.get("transcriptRetentionDays")) : undefined;

  const stripeMonthlyPriceId = formData.get("stripeMonthlyPriceId") as string | undefined;
  const stripeAnnualPriceId = formData.get("stripeAnnualPriceId") as string | undefined;
  const stripeProductId = formData.get("stripeProductId") as string | undefined;
  const isActive = formData.get("isActive") === "on";

  const featureJson = JSON.stringify({
    slug,
    description,
    monthlyPrice,
    originalMonthlyPrice,
    trialDays,
    maxAgents,
    maxPhoneNumbers,
    maxMonthlyCalls,
    maxMonthlyMinutes,
    maxConcurrentCalls,
    maxLeadsPerMonth,
    maxReservationRequestsPerMonth,
    maxOrderRequestsPerMonth,
    supportsForwarding,
    includesVapiPhoneNumber,
    prioritySupport,
    recordingRetentionDays,
    transcriptRetentionDays,
    stripeMonthlyPriceId,
    stripeAnnualPriceId,
    stripeProductId,
  });

  await prisma.package.create({
    data: {
      name,
      productType: "VOICE",
      featureJson,
      isActive,
      userLimit: 1, // default for voice if not used
    },
  });

  revalidatePath("/voice/admin/packages");
  redirect("/voice/admin/packages");
}

export async function updateVoicePackageAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const monthlyPrice = Number(formData.get("monthlyPrice"));
  const originalMonthlyPrice = formData.get("originalMonthlyPrice") ? Number(formData.get("originalMonthlyPrice")) : undefined;
  const trialDays = formData.get("trialDays") ? Number(formData.get("trialDays")) : undefined;

  const maxAgents = formData.get("maxAgents") ? Number(formData.get("maxAgents")) : undefined;
  const maxPhoneNumbers = formData.get("maxPhoneNumbers") ? Number(formData.get("maxPhoneNumbers")) : undefined;
  const maxMonthlyCalls = formData.get("maxMonthlyCalls") ? Number(formData.get("maxMonthlyCalls")) : undefined;
  const maxMonthlyMinutes = formData.get("maxMonthlyMinutes") ? Number(formData.get("maxMonthlyMinutes")) : undefined;
  const maxConcurrentCalls = formData.get("maxConcurrentCalls") ? Number(formData.get("maxConcurrentCalls")) : undefined;
  const maxLeadsPerMonth = formData.get("maxLeadsPerMonth") ? Number(formData.get("maxLeadsPerMonth")) : undefined;
  const maxReservationRequestsPerMonth = formData.get("maxReservationRequestsPerMonth") ? Number(formData.get("maxReservationRequestsPerMonth")) : undefined;
  const maxOrderRequestsPerMonth = formData.get("maxOrderRequestsPerMonth") ? Number(formData.get("maxOrderRequestsPerMonth")) : undefined;
  const supportsForwarding = formData.get("supportsForwarding") === "on";
  const includesVapiPhoneNumber = formData.get("includesVapiPhoneNumber") === "on";
  const prioritySupport = formData.get("prioritySupport") === "on";
  const recordingRetentionDays = formData.get("recordingRetentionDays") ? Number(formData.get("recordingRetentionDays")) : undefined;
  const transcriptRetentionDays = formData.get("transcriptRetentionDays") ? Number(formData.get("transcriptRetentionDays")) : undefined;

  const stripeMonthlyPriceId = formData.get("stripeMonthlyPriceId") as string | undefined;
  const stripeAnnualPriceId = formData.get("stripeAnnualPriceId") as string | undefined;
  const stripeProductId = formData.get("stripeProductId") as string | undefined;
  const isActive = formData.get("isActive") === "on";

  const featureJson = JSON.stringify({
    slug,
    description,
    monthlyPrice,
    originalMonthlyPrice,
    trialDays,
    maxAgents,
    maxPhoneNumbers,
    maxMonthlyCalls,
    maxMonthlyMinutes,
    maxConcurrentCalls,
    maxLeadsPerMonth,
    maxReservationRequestsPerMonth,
    maxOrderRequestsPerMonth,
    supportsForwarding,
    includesVapiPhoneNumber,
    prioritySupport,
    recordingRetentionDays,
    transcriptRetentionDays,
    stripeMonthlyPriceId,
    stripeAnnualPriceId,
    stripeProductId,
  });

  await prisma.package.update({
    where: { id },
    data: {
      name,
      featureJson,
      isActive,
    },
  });

  revalidatePath("/voice/admin/packages");
  redirect("/voice/admin/packages");
}

export async function deleteVoicePackageAction(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.package.delete({
    where: { id },
  });
  revalidatePath("/voice/admin/packages");
}
