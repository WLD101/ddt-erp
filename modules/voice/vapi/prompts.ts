import { VoiceBusinessProfile, VoiceKnowledgeBaseItem, VoiceReceptionistSettings } from "@prisma/client";

import { buildBusinessSpecificReceptionistPrompt } from "@/modules/voice/training/prompt-builder";

export function buildReceptionistPrompt(
  profile: VoiceBusinessProfile | null,
  settings: VoiceReceptionistSettings | null,
  knowledgeBase: VoiceKnowledgeBaseItem[],
): string {
  return buildBusinessSpecificReceptionistPrompt({
    businessIdentity: {
      businessName: profile?.businessName || "WhatsQuery Voice Business",
      industry: profile?.industry || "Service business",
      primaryLanguage: settings?.languageMode || profile?.preferredLanguage || "AUTO_DETECT",
      supportedLanguages: [settings?.languageMode || profile?.preferredLanguage || "AUTO_DETECT"],
      tone: "PROFESSIONAL",
      greetingMessage: settings?.greetingMessage || profile?.greetingMessage || null,
      closingMessage: settings?.fallbackMessage || null,
      openingHours: settings?.businessHours || profile?.openingHours || null,
      fallbackContactMethod: profile?.fallbackContactMethod || null,
      businessPhone: profile?.businessPhone || null,
      website: profile?.website || null,
      mainGoal: profile?.mainGoal || null,
    },
    agent: {
      id: null,
      name: settings?.receptionistName || "WhatsQuery Receptionist",
      role: "AI_RECEPTIONIST",
      languageMode: settings?.languageMode || profile?.preferredLanguage || "AUTO_DETECT",
      supportedLanguages: [settings?.languageMode || profile?.preferredLanguage || "AUTO_DETECT"],
      tone: "PROFESSIONAL",
      voicePersona: "Professional, calm, and helpful",
      allowedTools: [
        "lookup_faq",
        "get_business_hours",
        "get_fallback_contact",
        "capture_lead",
        "summarize_call",
      ],
      assistantId: null,
      assistantName: null,
      phoneNumberId: null,
      isDefault: true,
      isActive: true,
      lastPromptSyncedAt: null,
    },
    services: [],
    knowledgeBase,
    bookingRules: {
      acceptsBookings: false,
      bookingType: "APPOINTMENT",
      bookingMode: "REQUEST_ONLY",
      requiredFields: [],
    },
    orderRules: {
      acceptsOrderRequests: false,
      orderMode: "REQUEST_ONLY",
      orderTypes: [],
      requiredFields: [],
    },
    handoffRules: {
      fallbackPhone: profile?.businessPhone || null,
      fallbackEmail: null,
      handoffTriggers: ["UNKNOWN_ANSWER"],
    },
    actionPolicy: {
      allowedActions: ["ANSWER_FAQS", "CAPTURE_LEADS", "HANDOFF_TO_STAFF", "SUMMARIZE_CALL"],
      blockedActions: [
        "TAKE_PAYMENTS",
        "CONFIRM_PAID_ORDERS",
        "ISSUE_REFUNDS",
        "CANCEL_BOOKINGS",
        "CREATE_INVOICES",
        "DELETE_RECORDS",
        "CHANGE_ERP_FINANCIAL_DATA",
        "GIVE_MEDICAL_LEGAL_FINANCIAL_ADVICE",
        "PROMISE_DELIVERY_TIME_WITHOUT_CONFIGURED_RULE",
      ],
      erpWritesEnabled: false,
      backendAutoConfirmationEnabled: false,
    },
  });
}
