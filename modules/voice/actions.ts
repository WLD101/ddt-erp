"use server";

import { revalidatePath } from "next/cache";

import { createServerAction } from "@/lib/actions/builder";
import { prisma } from "@/lib/prisma";
import {
  deleteVoiceKnowledgeBaseItemSchema,
  voiceBusinessProfileSchema,
  voiceCallLogSchema,
  voiceKnowledgeBaseItemSchema,
  voiceLeadSchema,
  voiceReceptionistSettingsSchema,
} from "@/modules/voice/schema";

const voiceRevalidatePaths = [
  "/voice/onboarding",
  "/voice/dashboard",
  "/voice/dashboard/settings",
  "/voice/dashboard/knowledge-base",
  "/voice/dashboard/leads",
  "/voice/dashboard/call-logs",
  "/voice/dashboard/integrations",
];

export const saveVoiceBusinessProfileAction = createServerAction({
  label: "Save Voice Business Profile",
  schema: voiceBusinessProfileSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_BUSINESS_PROFILE_UPDATED",
    entityType: "VoiceBusinessProfile",
    getEntityId: (result) => result.id,
    getDetails: (input) => `Updated business onboarding for voice receptionist (${input.businessName}).`,
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const profile = await db.voiceBusinessProfile.upsert({
      where: { organizationId: orgId },
      update: {
        businessName: input.businessName,
        industry: input.industry || null,
        website: input.website || null,
        businessPhone: input.businessPhone,
        preferredLanguage: input.preferredLanguage,
        openingHours: input.openingHours,
        mainGoal: input.mainGoal,
        fallbackContactMethod: input.fallbackContactMethod,
        greetingMessage: input.greetingMessage,
      },
      create: {
        organizationId: orgId,
        businessName: input.businessName,
        industry: input.industry || null,
        website: input.website || null,
        businessPhone: input.businessPhone,
        preferredLanguage: input.preferredLanguage,
        openingHours: input.openingHours,
        mainGoal: input.mainGoal,
        fallbackContactMethod: input.fallbackContactMethod,
        greetingMessage: input.greetingMessage,
      },
    });

    await db.voiceReceptionistSettings.upsert({
      where: { organizationId: orgId },
      update: {
        greetingMessage: input.greetingMessage,
        languageMode: input.preferredLanguage,
        businessHours: input.openingHours,
      },
      create: {
        organizationId: orgId,
        greetingMessage: input.greetingMessage,
        fallbackMessage: "Thanks for calling. We missed your call, but our team will get back to you soon.",
        languageMode: input.preferredLanguage,
        businessHours: input.openingHours,
        afterHoursBehavior: "TAKE_MESSAGE",
        leadCaptureFields: JSON.stringify(["name", "phone", "reason"]),
      },
    });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return profile;
  },
});

export const saveVoiceReceptionistSettingsAction = createServerAction({
  label: "Save Voice Receptionist Settings",
  schema: voiceReceptionistSettingsSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_RECEPTIONIST_SETTINGS_UPDATED",
    entityType: "VoiceReceptionistSettings",
    getEntityId: (result) => result.id,
    getDetails: (input) => `Updated receptionist settings for ${input.receptionistName}.`,
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const settings = await db.voiceReceptionistSettings.upsert({
      where: { organizationId: orgId },
      update: {
        receptionistName: input.receptionistName,
        greetingMessage: input.greetingMessage,
        fallbackMessage: input.fallbackMessage,
        languageMode: input.languageMode,
        businessHours: input.businessHours,
        afterHoursBehavior: input.afterHoursBehavior,
        leadCaptureFields: JSON.stringify(input.leadCaptureFields),
      },
      create: {
        organizationId: orgId,
        receptionistName: input.receptionistName,
        greetingMessage: input.greetingMessage,
        fallbackMessage: input.fallbackMessage,
        languageMode: input.languageMode,
        businessHours: input.businessHours,
        afterHoursBehavior: input.afterHoursBehavior,
        leadCaptureFields: JSON.stringify(input.leadCaptureFields),
      },
    });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return settings;
  },
});

export const saveVoiceKnowledgeBaseItemAction = createServerAction({
  label: "Save Voice Knowledge Base Item",
  schema: voiceKnowledgeBaseItemSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_KNOWLEDGE_BASE_ITEM_SAVED",
    entityType: "VoiceKnowledgeBaseItem",
    getEntityId: (result) => result.id,
    getDetails: (input) => `Saved FAQ item "${input.question}".`,
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const existingItem = input.id
      ? await db.voiceKnowledgeBaseItem.findFirst({
          where: { id: input.id },
          select: { id: true },
        })
      : null;

    if (input.id && !existingItem) {
      throw new Error("Knowledge base item not found.");
    }

    const item = input.id
      ? await prisma.voiceKnowledgeBaseItem.update({
          where: { id: input.id },
          data: {
            question: input.question,
            answer: input.answer,
            category: input.category || null,
            isActive: input.isActive,
          },
        })
      : await db.voiceKnowledgeBaseItem.create({
          data: {
            organizationId: orgId,
            question: input.question,
            answer: input.answer,
            category: input.category || null,
            isActive: input.isActive,
          },
        });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return item;
  },
});

export const deleteVoiceKnowledgeBaseItemAction = createServerAction({
  label: "Delete Voice Knowledge Base Item",
  schema: deleteVoiceKnowledgeBaseItemSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_KNOWLEDGE_BASE_ITEM_DELETED",
    entityType: "VoiceKnowledgeBaseItem",
    getEntityId: (result) => result.id,
    getDetails: () => "Removed a voice knowledge base item.",
  },
  handler: async ({ input, context: { db } }) => {
    const existingItem = await db.voiceKnowledgeBaseItem.findFirst({
      where: { id: input.id },
      select: { id: true },
    });

    if (!existingItem) {
      throw new Error("Knowledge base item not found.");
    }

    const item = await prisma.voiceKnowledgeBaseItem.delete({
      where: { id: input.id },
    });
    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return item;
  },
});

export const createVoiceLeadAction = createServerAction({
  label: "Create Voice Lead",
  schema: voiceLeadSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_LEAD_CREATED",
    entityType: "VoiceLead",
    getEntityId: (result) => result.id,
    getDetails: (input) => `Created a receptionist lead for ${input.name || input.phone || "unknown caller"}.`,
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const lead = await db.voiceLead.create({
      data: {
        organizationId: orgId,
        name: input.name || null,
        phone: input.phone || null,
        email: input.email || null,
        reasonForCall: input.reasonForCall,
        status: input.status,
        notes: input.notes || null,
        source: "MANUAL",
        appointmentRequested: input.appointmentRequested,
      },
    });
    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return lead;
  },
});

export const createVoiceCallLogAction = createServerAction({
  label: "Create Voice Call Log",
  schema: voiceCallLogSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_CALL_LOG_CREATED",
    entityType: "VoiceCallLog",
    getEntityId: (result) => result.id,
    getDetails: (input) => `Created a development call log for ${input.callerNumber}.`,
  },
  handler: async ({ input, context: { db, orgId } }) => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Development-only call log creation is disabled in production.");
    }

    const log = await db.voiceCallLog.create({
      data: {
        organizationId: orgId,
        callerNumber: input.callerNumber,
        callStatus: input.callStatus,
        callDirection: input.callDirection,
        summary: input.summary,
        transcriptPlaceholder: input.transcriptPlaceholder || null,
        durationSeconds: input.durationSeconds,
        appointmentRequested: input.appointmentRequested,
        isMissed: input.callStatus === "MISSED",
      },
    });
    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return log;
  },
});
