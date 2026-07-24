"use server";

import { revalidatePath } from "next/cache";

import { encryptIntegrationCredentials } from "@/lib/integrations";
import { hashToken } from "@/lib/security/tokens";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { voiceWhatsappIntegrationSchema, voiceWhatsappTemplateSchema } from "@/modules/voice/whatsapp/schema";

const revalidateWhatsappPaths = [
  "/voice/dashboard/integrations",
  "/voice/dashboard/integrations/whatsapp",
  "/voice/dashboard/whatsapp/inbox",
  "/voice/dashboard/whatsapp/conversations",
  "/voice/admin/whatsapp",
];

function boolFromForm(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function saveWhatsappIntegrationAction(formData: FormData) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const parsed = voiceWhatsappIntegrationSchema.safeParse({
    whatsappBusinessAccountId: formData.get("whatsappBusinessAccountId")?.toString() || "",
    phoneNumberId: formData.get("phoneNumberId")?.toString() || "",
    phoneNumberDisplayName: formData.get("phoneNumberDisplayName")?.toString() || "",
    accessToken: formData.get("accessToken")?.toString() || "",
    webhookVerifyToken: formData.get("webhookVerifyToken")?.toString() || "",
    voiceAgentId: formData.get("voiceAgentId")?.toString() || "",
    staffNotificationNumber: formData.get("staffNotificationNumber")?.toString() || "",
    isEnabled: boolFromForm(formData.get("isEnabled")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const input = parsed.data;
  const voiceAgentId = input.voiceAgentId || null;

  if (voiceAgentId) {
    const agent = await prisma.voiceAgent.findFirst({
      where: { id: voiceAgentId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!agent) {
      throw new Error("Selected VoiceAgent does not belong to this tenant.");
    }
  }

  const existing = await prisma.voiceWhatsappIntegration.findUnique({
    where: { phoneNumberId: input.phoneNumberId },
    select: { id: true, organizationId: true, accessTokenEncrypted: true, webhookVerifyTokenHash: true },
  });

  if (existing && existing.organizationId !== ctx.organizationId) {
    throw new Error("This WhatsApp phone number ID is already assigned to another tenant.");
  }

  const accessTokenEncrypted = input.accessToken
    ? encryptIntegrationCredentials({ accessToken: input.accessToken })
    : existing?.accessTokenEncrypted || null;
  const webhookVerifyTokenHash = input.webhookVerifyToken
    ? hashToken(input.webhookVerifyToken)
    : existing?.webhookVerifyTokenHash || null;

  if (existing) {
    await prisma.voiceWhatsappIntegration.update({
        where: { id: existing.id },
        data: {
          voiceAgentId,
          whatsappBusinessAccountId: input.whatsappBusinessAccountId || null,
          phoneNumberDisplayName: input.phoneNumberDisplayName || null,
          accessTokenEncrypted,
          webhookVerifyTokenHash,
          staffNotificationNumber: input.staffNotificationNumber || null,
          isEnabled: input.isEnabled,
          status: input.isEnabled ? "CONNECTED" : "CONFIGURED",
        },
      });
  } else {
    await prisma.voiceWhatsappIntegration.create({
        data: {
          organizationId: ctx.organizationId,
          voiceAgentId,
          whatsappBusinessAccountId: input.whatsappBusinessAccountId || null,
          phoneNumberId: input.phoneNumberId,
          phoneNumberDisplayName: input.phoneNumberDisplayName || null,
          accessTokenEncrypted,
          webhookVerifyTokenHash,
          staffNotificationNumber: input.staffNotificationNumber || null,
          isEnabled: input.isEnabled,
          status: input.isEnabled ? "CONNECTED" : "CONFIGURED",
        },
      });
  }

  revalidateWhatsappPaths.forEach((path) => revalidatePath(path));
}

export async function createWhatsappTemplateAction(formData: FormData) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const parsed = voiceWhatsappTemplateSchema.safeParse({
    name: formData.get("name")?.toString() || "",
    language: formData.get("language")?.toString() || "en",
    category: formData.get("category")?.toString() || "",
    body: formData.get("body")?.toString() || "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const input = parsed.data;
  await prisma.voiceWhatsappTemplate.upsert({
    where: {
      organizationId_name_language: {
        organizationId: ctx.organizationId,
        name: input.name,
        language: input.language,
      },
    },
    update: {
      category: input.category || null,
      body: input.body,
      status: "DRAFT",
    },
    create: {
      organizationId: ctx.organizationId,
      name: input.name,
      language: input.language,
      category: input.category || null,
      body: input.body,
      status: "DRAFT",
    },
  });

  revalidateWhatsappPaths.forEach((path) => revalidatePath(path));
}
