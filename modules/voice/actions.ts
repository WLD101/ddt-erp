"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

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
import {
  deleteVoiceServiceItemSchema,
  voiceActionPolicySchema,
  voiceBookingRulesSchema,
  voiceHandoffRulesSchema,
  voiceOrderRulesSchema,
  voiceServiceItemSchema,
  voiceTrainingProfileSchema,
} from "@/modules/voice/training/schema";
import { syncVoiceTrainingPromptToVapi } from "@/modules/voice/training/service";

const voiceRevalidatePaths = [
  "/voice/onboarding",
  "/voice/dashboard",
  "/voice/dashboard/command-center",
  "/voice/dashboard/settings",
  "/voice/dashboard/knowledge-base",
  "/voice/dashboard/leads",
  "/voice/dashboard/reservations",
  "/voice/dashboard/orders",
  "/voice/dashboard/call-logs",
  "/voice/dashboard/integrations",
  "/voice/dashboard/integrations/vapi",
  "/voice/dashboard/training",
];

const syncVoiceAgentPromptSchema = z.object({
  voiceAgentId: z.string().trim().min(1, "Voice agent is required."),
});

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

export const saveVoiceTrainingProfileAction = createServerAction({
  label: "Save Voice Training Profile",
  schema: voiceTrainingProfileSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_TRAINING_PROFILE_UPDATED",
    entityType: "VoiceBusinessTrainingProfile",
    getEntityId: (result) => result.id,
    getDetails: (input) => `Updated business training identity for ${input.businessName}.`,
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const profile = await db.voiceBusinessProfile.upsert({
      where: { organizationId: orgId },
      update: {
        businessName: input.businessName,
        industry: input.industry,
        website: input.website || null,
        businessPhone: input.businessPhone,
        preferredLanguage: input.primaryLanguage,
        openingHours: input.openingHours,
        mainGoal: input.mainGoal,
        fallbackContactMethod: input.fallbackContactMethod,
        greetingMessage: input.greetingMessage,
      },
      create: {
        organizationId: orgId,
        businessName: input.businessName,
        industry: input.industry,
        website: input.website || null,
        businessPhone: input.businessPhone,
        preferredLanguage: input.primaryLanguage,
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
        fallbackMessage: input.closingMessage,
        languageMode: input.primaryLanguage,
        businessHours: input.openingHours,
      },
      create: {
        organizationId: orgId,
        receptionistName: "WhatsQuery Receptionist",
        greetingMessage: input.greetingMessage,
        fallbackMessage: input.closingMessage,
        languageMode: input.primaryLanguage,
        businessHours: input.openingHours,
        afterHoursBehavior: "TAKE_MESSAGE",
        leadCaptureFields: JSON.stringify(["name", "phone", "reason"]),
      },
    });

    const training = await db.voiceBusinessTrainingProfile.upsert({
      where: { organizationId: orgId },
      update: {
        locationCity: input.locationCity,
        shortDescription: input.shortDescription,
        primaryLanguage: input.primaryLanguage,
        supportedLanguages: JSON.stringify(input.supportedLanguages),
        tone: input.tone,
        closingMessage: input.closingMessage,
        holidayClosures: input.holidayClosures || null,
      },
      create: {
        organizationId: orgId,
        locationCity: input.locationCity,
        shortDescription: input.shortDescription,
        primaryLanguage: input.primaryLanguage,
        supportedLanguages: JSON.stringify(input.supportedLanguages),
        tone: input.tone,
        closingMessage: input.closingMessage,
        holidayClosures: input.holidayClosures || null,
      },
    });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return training ?? profile;
  },
});

export const saveVoiceServiceItemAction = createServerAction({
  label: "Save Voice Service Item",
  schema: voiceServiceItemSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_SERVICE_ITEM_SAVED",
    entityType: "VoiceServiceItem",
    getEntityId: (result) => result.id,
    getDetails: (input) => `Saved voice service or menu item "${input.name}".`,
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const existingItem = input.id
      ? await db.voiceServiceItem.findFirst({ where: { id: input.id }, select: { id: true } })
      : null;

    if (input.id && !existingItem) {
      throw new Error("Service item not found.");
    }

    const item = input.id
      ? await prisma.voiceServiceItem.update({
          where: { id: input.id },
          data: {
            name: input.name,
            category: input.category || null,
            description: input.description || null,
            pricePlaceholder: input.pricePlaceholder || null,
            availability: input.availability || null,
            notes: input.notes || null,
            takeawayAvailable: input.takeawayAvailable,
            deliveryAvailable: input.deliveryAvailable,
            dineInAvailable: input.dineInAvailable,
            isActive: input.isActive,
          },
        })
      : await db.voiceServiceItem.create({
          data: {
            organizationId: orgId,
            name: input.name,
            category: input.category || null,
            description: input.description || null,
            pricePlaceholder: input.pricePlaceholder || null,
            availability: input.availability || null,
            notes: input.notes || null,
            takeawayAvailable: input.takeawayAvailable,
            deliveryAvailable: input.deliveryAvailable,
            dineInAvailable: input.dineInAvailable,
            isActive: input.isActive,
          },
        });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return item;
  },
});

export const deleteVoiceServiceItemAction = createServerAction({
  label: "Delete Voice Service Item",
  schema: deleteVoiceServiceItemSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_SERVICE_ITEM_DELETED",
    entityType: "VoiceServiceItem",
    getEntityId: (result) => result.id,
    getDetails: () => "Removed a voice service or menu item.",
  },
  handler: async ({ input, context: { db } }) => {
    const existingItem = await db.voiceServiceItem.findFirst({
      where: { id: input.id },
      select: { id: true },
    });

    if (!existingItem) {
      throw new Error("Service item not found.");
    }

    const item = await prisma.voiceServiceItem.delete({
      where: { id: input.id },
    });
    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return item;
  },
});

export const saveVoiceBookingRulesAction = createServerAction({
  label: "Save Voice Booking Rules",
  schema: voiceBookingRulesSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_BOOKING_RULES_UPDATED",
    entityType: "VoiceBookingRules",
    getEntityId: (result) => result.id,
    getDetails: () => "Updated voice receptionist booking rules.",
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const rules = await db.voiceBookingRules.upsert({
      where: { organizationId: orgId },
      update: {
        acceptsBookings: input.acceptsBookings,
        bookingType: input.bookingType,
        bookingMode: input.bookingMode,
        requiredFields: JSON.stringify(input.requiredFields),
        maxPartySize: input.maxPartySize ?? null,
        bookingDurationMinutes: input.bookingDurationMinutes ?? null,
        advanceBookingLimitHours: input.advanceBookingLimitHours ?? null,
        confirmationMessage: input.confirmationMessage || null,
        fallbackMessage: input.fallbackMessage || null,
      },
      create: {
        organizationId: orgId,
        acceptsBookings: input.acceptsBookings,
        bookingType: input.bookingType,
        bookingMode: input.bookingMode,
        requiredFields: JSON.stringify(input.requiredFields),
        maxPartySize: input.maxPartySize ?? null,
        bookingDurationMinutes: input.bookingDurationMinutes ?? null,
        advanceBookingLimitHours: input.advanceBookingLimitHours ?? null,
        confirmationMessage: input.confirmationMessage || null,
        fallbackMessage: input.fallbackMessage || null,
      },
    });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return rules;
  },
});

export const saveVoiceOrderRulesAction = createServerAction({
  label: "Save Voice Order Rules",
  schema: voiceOrderRulesSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_ORDER_RULES_UPDATED",
    entityType: "VoiceOrderRules",
    getEntityId: (result) => result.id,
    getDetails: () => "Updated voice receptionist order request rules.",
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const rules = await db.voiceOrderRules.upsert({
      where: { organizationId: orgId },
      update: {
        acceptsOrderRequests: input.acceptsOrderRequests,
        orderMode: input.orderMode,
        orderTypes: JSON.stringify(input.orderTypes),
        requiredFields: JSON.stringify(input.requiredFields),
        allergyDisclaimer: input.allergyDisclaimer || null,
        confirmationWording: input.confirmationWording || null,
      },
      create: {
        organizationId: orgId,
        acceptsOrderRequests: input.acceptsOrderRequests,
        orderMode: input.orderMode,
        orderTypes: JSON.stringify(input.orderTypes),
        requiredFields: JSON.stringify(input.requiredFields),
        allergyDisclaimer: input.allergyDisclaimer || null,
        confirmationWording: input.confirmationWording || null,
      },
    });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return rules;
  },
});

export const saveVoiceHandoffRulesAction = createServerAction({
  label: "Save Voice Handoff Rules",
  schema: voiceHandoffRulesSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_HANDOFF_RULES_UPDATED",
    entityType: "VoiceHandoffRules",
    getEntityId: (result) => result.id,
    getDetails: () => "Updated voice receptionist handoff rules.",
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const rules = await db.voiceHandoffRules.upsert({
      where: { organizationId: orgId },
      update: {
        fallbackPhone: input.fallbackPhone || null,
        fallbackEmail: input.fallbackEmail || null,
        staffNotificationPlaceholder: input.staffNotificationPlaceholder || null,
        handoffTriggers: JSON.stringify(input.handoffTriggers),
      },
      create: {
        organizationId: orgId,
        fallbackPhone: input.fallbackPhone || null,
        fallbackEmail: input.fallbackEmail || null,
        staffNotificationPlaceholder: input.staffNotificationPlaceholder || null,
        handoffTriggers: JSON.stringify(input.handoffTriggers),
      },
    });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return rules;
  },
});

export const saveVoiceActionPolicyAction = createServerAction({
  label: "Save Voice Action Policy",
  schema: voiceActionPolicySchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_ACTION_POLICY_UPDATED",
    entityType: "VoiceAllowedActionPolicy",
    getEntityId: (result) => result.id,
    getDetails: () => "Updated voice receptionist allowed and blocked actions.",
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const policy = await db.voiceAllowedActionPolicy.upsert({
      where: { organizationId: orgId },
      update: {
        allowedActions: JSON.stringify(input.allowedActions),
        blockedActions: JSON.stringify(input.blockedActions),
        erpWritesEnabled: false,
        backendAutoConfirmationEnabled: false,
      },
      create: {
        organizationId: orgId,
        allowedActions: JSON.stringify(input.allowedActions),
        blockedActions: JSON.stringify(input.blockedActions),
        erpWritesEnabled: false,
        backendAutoConfirmationEnabled: false,
      },
    });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return policy;
  },
});

export const syncVoiceTrainingPromptAction = createServerAction({
  label: "Sync Voice Training Prompt",
  schema: syncVoiceAgentPromptSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_PROMPT_SYNCED_TO_VAPI",
    entityType: "VoiceBusinessTrainingProfile",
    getEntityId: (result) => result.voiceAgentId || "voice-training-prompt",
    getDetails: (input) => `Synced business-specific receptionist prompt to Vapi for agent ${input.voiceAgentId}.`,
  },
  handler: async ({ input, context: { orgId } }) => {
    const result = await syncVoiceTrainingPromptToVapi(orgId, { voiceAgentId: input.voiceAgentId });
    voiceRevalidatePaths.forEach((path) => revalidatePath(path));
    return result;
  },
});

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

function parseMenuTextFallback(text: string) {
  const lines = text.split("\n");
  const items: any[] = [];
  let currentCategory = "General";

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Category check
    if (line.length < 30 && !/\d/.test(line) && (line.endsWith(":") || line === line.toUpperCase())) {
      currentCategory = line.replace(/:$/, "").trim();
      continue;
    }

    // Match patterns: "Name - Price - Desc"
    const match = line.match(/^([^:-]+)[:(-]\s*(\d+|Rs\.?\s*\d+|PKR\s*\d+|[\d,]+)\s*\)?\s*(.*)$/i) ||
                  line.match(/^([^:-]+)\s+([Rs|PKR|USD]?\s*\d+[\d,]*)\s*(.*)$/i);
    if (match) {
      const name = match[1].trim();
      const price = match[2].trim();
      const description = match[3]?.trim() || "";
      items.push({
        name,
        category: currentCategory,
        description: description || undefined,
        pricePlaceholder: price,
        availability: "Available",
        notes: "",
        takeawayAvailable: true,
        deliveryAvailable: true,
        dineInAvailable: true,
        isActive: true,
      });
    } else if (line.length > 3) {
      items.push({
        name: line,
        category: currentCategory,
        description: "",
        pricePlaceholder: "Contact for price",
        availability: "Available",
        notes: "",
        takeawayAvailable: true,
        deliveryAvailable: true,
        dineInAvailable: true,
        isActive: true,
      });
    }
  }
  return items;
}

async function parseVoiceMenuText(menuText: string): Promise<any[]> {
  const prompt = `You are an expert AI data extractor. Extract menu, service offerings, rate lists, or charges charts from the text below.
Format your output as a valid JSON array of service/menu items. Do not wrap it in markdown block tags like \`\`\`json. Return only the raw JSON array.

Each item MUST follow this structure:
{
  "name": "string (name of the service or menu item, required)",
  "category": "string (optional category, e.g. 'Starters', 'Consultations')",
  "description": "string (optional description)",
  "pricePlaceholder": "string (optional price guidance, e.g. 'PKR 1,500' or 'Price on request')",
  "availability": "string (optional availability, e.g. 'Weekdays only')",
  "notes": "string (optional additional notes)",
  "takeawayAvailable": boolean (default true),
  "deliveryAvailable": boolean (default true),
  "dineInAvailable": boolean (default true),
  "isActive": boolean (default true)
}

Input text to extract from:
${menuText}`;

  // Try OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          const parsed = JSON.parse(cleanJsonString(content));
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (err) {
      console.error("[Voice Import] OpenAI call failed, falling back:", err);
    }
  }

  // Try Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (content) {
          const parsed = JSON.parse(cleanJsonString(content));
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (err) {
      console.error("[Voice Import] Gemini call failed, falling back:", err);
    }
  }

  return parseMenuTextFallback(menuText);
}

export const importVoiceMenuAction = createServerAction({
  label: "Import Voice Menu",
  schema: z.object({
    menuText: z.string().min(5, "Menu text must be at least 5 characters."),
    clearExisting: z.boolean().default(false),
  }),
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_MENU_IMPORTED",
    entityType: "VoiceServiceItem",
    getEntityId: () => "imported",
    getDetails: (input) => `Imported and summarized voice menu / rate list (clearExisting: ${input.clearExisting}).`,
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const parsedItems = await parseVoiceMenuText(input.menuText);

    if (parsedItems.length === 0) {
      throw new Error("No menu items could be parsed. Please verify the format.");
    }

    if (input.clearExisting) {
      await db.voiceServiceItem.deleteMany({
        where: { organizationId: orgId },
      });
    }

    const createdItems = [];
    for (const item of parsedItems) {
      if (!item.name) continue;
      const created = await db.voiceServiceItem.create({
        data: {
          organizationId: orgId,
          name: String(item.name).trim(),
          category: item.category ? String(item.category).trim() : null,
          description: item.description ? String(item.description).trim() : null,
          pricePlaceholder: item.pricePlaceholder ? String(item.pricePlaceholder).trim() : null,
          availability: item.availability ? String(item.availability).trim() : null,
          notes: item.notes ? String(item.notes).trim() : null,
          takeawayAvailable: item.takeawayAvailable !== false,
          deliveryAvailable: item.deliveryAvailable !== false,
          dineInAvailable: item.dineInAvailable !== false,
          isActive: item.isActive !== false,
        },
      });
      createdItems.push(created);
    }

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));

    const wasAi = !!(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);

    return {
      success: true,
      count: createdItems.length,
      method: wasAi ? "AI Summary" : "Fallback Regex Scanner",
    };
  },
});

export const saveTwilioSettingsAction = createServerAction({
  label: "Save Twilio Settings",
  schema: z.object({
    accountSid: z.string().trim().min(1, "Account SID is required."),
    authToken: z.string().trim().min(1, "Auth Token is required."),
    phoneNumber: z.string().trim().min(1, "Twilio Phone Number is required."),
    twilioStatus: z.string().default("CONNECTED"),
  }),
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_TWILIO_SETTINGS_UPDATED",
    entityType: "VoiceIntegrationSettings",
    getEntityId: (result) => result.id,
    getDetails: (input) => `Updated Twilio integration settings for phone number ${input.phoneNumber}.`,
  },
  handler: async ({ input, context: { db, orgId } }) => {
    const configNotes = JSON.stringify({
      accountSid: input.accountSid,
      authToken: input.authToken,
      phoneNumber: input.phoneNumber,
    });

    const settings = await db.voiceIntegrationSettings.upsert({
      where: { organizationId: orgId },
      update: {
        twilioStatus: input.twilioStatus,
        providerConfigNotes: configNotes,
      },
      create: {
        organizationId: orgId,
        twilioStatus: input.twilioStatus,
        providerConfigNotes: configNotes,
      },
    });

    voiceRevalidatePaths.forEach((path) => revalidatePath(path));

    return settings;
  },
});


