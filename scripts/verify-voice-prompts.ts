import {
  buildBusinessSpecificReceptionistPrompt,
  buildVoiceAssistantDisplayName,
  buildVoiceAssistantFirstMessage,
  validateBusinessSpecificReceptionistPrompt,
} from "@/modules/voice/training/prompt-builder";

function buildRuntime(businessName: string, industry: string, agentName: string) {
  return {
    businessIdentity: {
      businessName,
      industry,
      locationCity: "Karachi",
      shortDescription: `${businessName} front-desk training profile.`,
      primaryLanguage: "AUTO_DETECT",
      supportedLanguages: ["ENGLISH", "URDU", "ROMAN_URDU"],
      tone: "PAKISTANI_POLITE",
      greetingMessage: "",
      closingMessage: "Thank you for calling.",
      openingHours: "Mon-Sun 9 AM to 11 PM",
      holidayClosures: "",
      fallbackContactMethod: "WHATSAPP",
      businessPhone: "+92 300 0000000",
      website: "https://example.com",
      mainGoal: "Answer FAQs and capture requests",
    },
    agent: {
      id: `agent-${businessName.toLowerCase().replace(/\s+/g, "-")}`,
      name: agentName,
      role: "AI_RECEPTIONIST",
      languageMode: "AUTO_DETECT",
      supportedLanguages: ["ENGLISH", "URDU", "ROMAN_URDU"],
      tone: "PAKISTANI_POLITE",
      voicePersona: "Professional and polite",
      allowedTools: ["lookup_faq", "get_business_hours", "capture_lead", "request_appointment", "create_order_request", "handoff_to_staff", "summarize_call"],
      assistantId: null,
      assistantName: null,
      phoneNumberId: null,
      isDefault: true,
      isActive: true,
      lastPromptSyncedAt: null,
    },
    services: [
      {
        name: "Front-desk service",
        category: "General",
        description: `Core service menu for ${businessName}`,
        pricePlaceholder: null,
        availability: null,
        notes: null,
        takeawayAvailable: false,
        deliveryAvailable: false,
        dineInAvailable: true,
        isActive: true,
      },
    ],
    knowledgeBase: [
      {
        question: "What are your hours?",
        answer: "We are open every day from 9 AM to 11 PM.",
        category: "Hours",
        isActive: true,
      },
    ],
    bookingRules: {
      acceptsBookings: true,
      bookingType: "APPOINTMENT",
      bookingMode: "REQUEST_ONLY",
      requiredFields: ["name", "phone", "date", "time"],
      maxPartySize: null,
      bookingDurationMinutes: null,
      advanceBookingLimitHours: null,
      confirmationMessage: null,
      fallbackMessage: null,
    },
    orderRules: {
      acceptsOrderRequests: true,
      orderMode: "REQUEST_ONLY",
      orderTypes: ["TAKEAWAY"],
      requiredFields: ["name", "phone", "items"],
      allergyDisclaimer: null,
      confirmationWording: null,
    },
    handoffRules: {
      fallbackPhone: "+92 300 0000000",
      fallbackEmail: "support@example.com",
      staffNotificationPlaceholder: null,
      handoffTriggers: ["UNKNOWN_ANSWER"],
    },
    actionPolicy: {
      allowedActions: ["ANSWER_FAQS", "CAPTURE_LEADS", "CREATE_APPOINTMENT_REQUEST", "CREATE_ORDER_REQUEST", "HANDOFF_TO_STAFF", "SUMMARIZE_CALL"],
      blockedActions: ["TAKE_PAYMENTS", "CREATE_INVOICES"],
      erpWritesEnabled: false,
      backendAutoConfirmationEnabled: false,
    },
  } as const;
}

const businesses = [
  { businessName: "CoffeeFix", industry: "Cafe", agentName: "Main Receptionist" },
  { businessName: "Elegenza", industry: "Restaurant", agentName: "Restaurant Receptionist" },
  { businessName: "Dr. Ali Dental Clinic", industry: "Dental Clinic", agentName: "Appointment Agent" },
];

for (const business of businesses) {
  const runtime = buildRuntime(business.businessName, business.industry, business.agentName);
  const prompt = buildBusinessSpecificReceptionistPrompt(runtime);
  const validation = validateBusinessSpecificReceptionistPrompt(runtime, prompt);

  console.log(`\n=== ${business.businessName} ===`);
  console.log(`Assistant Name: ${buildVoiceAssistantDisplayName(business.businessName, business.agentName)}`);
  console.log(`First Message: ${buildVoiceAssistantFirstMessage(runtime)}`);
  console.log(`Prompt Starts: ${prompt.slice(0, 180).replace(/\s+/g, " ")}...`);
  console.log(`Contains Alex/TechSolutions: ${/alex|techsolutions/i.test(prompt) ? "YES" : "NO"}`);
  console.log(`Validation: ${validation.isValid ? "PASS" : `FAIL -> ${validation.errors.join(" | ")}`}`);
}
