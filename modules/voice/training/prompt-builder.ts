type PromptServiceItem = {
  name: string;
  category: string | null;
  description: string | null;
  pricePlaceholder: string | null;
  availability: string | null;
  notes: string | null;
  takeawayAvailable: boolean;
  deliveryAvailable: boolean;
  dineInAvailable: boolean;
  isActive: boolean;
};

type PromptKnowledgeItem = {
  question: string;
  answer: string;
  category: string | null;
  isActive: boolean;
};

type PromptRuntime = {
  businessIdentity: {
    businessName: string;
    industry: string;
    locationCity?: string | null;
    shortDescription?: string | null;
    primaryLanguage: string;
    supportedLanguages: string[];
    tone: string;
    greetingMessage?: string | null;
    closingMessage?: string | null;
    openingHours?: string | null;
    holidayClosures?: string | null;
    fallbackContactMethod?: string | null;
    businessPhone?: string | null;
    website?: string | null;
    mainGoal?: string | null;
  };
  agent: {
    id?: string | null;
    name: string;
    displayName?: string | null;
    internalName?: string | null;
    businessSlug?: string | null;
    agentSlug?: string | null;
    environment?: string | null;
    role: string;
    languageMode: string;
    supportedLanguages: string[];
    tone: string;
    voicePersona?: string | null;
    allowedTools: string[];
    assistantId?: string | null;
    assistantName?: string | null;
    phoneTrackingName?: string | null;
    phoneNumberId?: string | null;
    isDefault: boolean;
    isActive: boolean;
    lastPromptSyncedAt?: Date | null;
  };
  services: PromptServiceItem[];
  knowledgeBase: PromptKnowledgeItem[];
  bookingRules: {
    acceptsBookings: boolean;
    bookingType: string;
    bookingMode: string;
    requiredFields: string[];
    maxPartySize?: number | null;
    bookingDurationMinutes?: number | null;
    advanceBookingLimitHours?: number | null;
    confirmationMessage?: string | null;
    fallbackMessage?: string | null;
  };
  orderRules: {
    acceptsOrderRequests: boolean;
    orderMode: string;
    orderTypes: string[];
    requiredFields: string[];
    allergyDisclaimer?: string | null;
    confirmationWording?: string | null;
  };
  handoffRules: {
    fallbackPhone?: string | null;
    fallbackEmail?: string | null;
    staffNotificationPlaceholder?: string | null;
    handoffTriggers: string[];
  };
  actionPolicy: {
    allowedActions: string[];
    blockedActions: string[];
    erpWritesEnabled: boolean;
    backendAutoConfirmationEnabled: boolean;
  };
};

const DISALLOWED_PROMPT_PLACEHOLDERS = [
  "alex from techsolutions customer support",
  "alex from techsolutions",
  "techsolutions",
  "whatsquery demo cafe",
  "demo café",
  "demo cafe",
] as const;

function labelize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None configured";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildVoiceAssistantDisplayName(businessName: string, agentName: string) {
  const sanitizedBusiness = businessName.trim();
  const businessPrefix = new RegExp(`^${escapeRegExp(sanitizedBusiness)}\\s*[-:]?\\s*`, "i");
  const trimmedAgentName = agentName.trim().replace(businessPrefix, "").trim() || "Main Receptionist";
  return `${sanitizedBusiness} - ${trimmedAgentName}`;
}

export function buildVoiceAssistantFirstMessage(runtime: PromptRuntime) {
  const businessName = runtime.businessIdentity.businessName.trim();
  const configuredGreeting = runtime.businessIdentity.greetingMessage?.trim();

  if (configuredGreeting && configuredGreeting.toLowerCase().includes(businessName.toLowerCase())) {
    return configuredGreeting;
  }

  return `Assalam-o-Alaikum, thanks for calling ${businessName}. I'm the AI receptionist. How can I help you today?`;
}

export function validateBusinessSpecificReceptionistPrompt(runtime: PromptRuntime, prompt: string) {
  const errors: string[] = [];
  const businessName = runtime.businessIdentity.businessName.trim();
  const normalizedPrompt = prompt.toLowerCase();

  if (!businessName || businessName === "WhatsQuery Voice Business") {
    errors.push("Business name is missing. Save a real business identity before syncing to Vapi.");
  }

  if (!runtime.agent.id) {
    errors.push("Voice agent is missing tenant scope. Select a valid tenant-scoped VoiceAgent before syncing.");
  }

  if (!runtime.agent.businessSlug) {
    errors.push("Business slug is missing. The assistant naming standard cannot be generated safely.");
  }

  if (!runtime.agent.agentSlug) {
    errors.push("Agent slug is missing. The assistant naming standard cannot be generated safely.");
  }

  if (!runtime.agent.internalName) {
    errors.push("Internal tracking name is missing. Each VoiceAgent must have a unique internal key.");
  }

  for (const blockedPhrase of DISALLOWED_PROMPT_PLACEHOLDERS) {
    if (normalizedPrompt.includes(blockedPhrase) && !businessName.toLowerCase().includes(blockedPhrase)) {
      errors.push(`Prompt still contains blocked placeholder text: "${blockedPhrase}".`);
    }
  }

  if (businessName && !normalizedPrompt.includes(businessName.toLowerCase())) {
    errors.push("Generated prompt does not include the selected business name.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function buildBusinessSpecificReceptionistPrompt(runtime: PromptRuntime) {
  const activeServices = runtime.services.filter((item) => item.isActive);
  const activeFaqs = runtime.knowledgeBase.filter((item) => item.isActive);

  const servicesSection =
    activeServices.length > 0
      ? activeServices
          .map((item) => {
            const modes = [
              item.dineInAvailable ? "dine-in" : null,
              item.takeawayAvailable ? "takeaway" : null,
              item.deliveryAvailable ? "delivery" : null,
            ]
              .filter(Boolean)
              .join(", ");

            return [
              `- ${item.name}`,
              item.category ? `  Category: ${item.category}` : null,
              item.description ? `  Description: ${item.description}` : null,
              item.pricePlaceholder ? `  Price guidance: ${item.pricePlaceholder}` : null,
              item.availability ? `  Availability: ${item.availability}` : null,
              modes ? `  Modes: ${modes}` : null,
              item.notes ? `  Notes: ${item.notes}` : null,
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n\n")
      : "- No services or menu items have been configured yet.";

  const faqSection =
    activeFaqs.length > 0
      ? activeFaqs
          .map((item) => [`Q: ${item.question}`, `A: ${item.answer}`, item.category ? `Category: ${item.category}` : null].filter(Boolean).join("\n"))
          .join("\n\n")
      : "No active FAQs are configured. If a caller asks something unsupported, offer to capture details or hand off.";

  return `You are the AI receptionist for ${runtime.businessIdentity.businessName}, a ${runtime.businessIdentity.industry} business${
    runtime.businessIdentity.locationCity ? ` based in ${runtime.businessIdentity.locationCity}` : ""
  }.

IDENTITY
- Business: ${runtime.businessIdentity.businessName}
- Industry: ${runtime.businessIdentity.industry}
- Receptionist agent: ${runtime.agent.name}
- Agent role: ${labelize(runtime.agent.role)}
- Description: ${runtime.businessIdentity.shortDescription || "Not configured"}
- Primary language: ${labelize(runtime.businessIdentity.primaryLanguage)}
- Supported languages:
${formatList(runtime.businessIdentity.supportedLanguages.map(labelize))}
- Tone: ${labelize(runtime.businessIdentity.tone)}
- Voice persona: ${runtime.agent.voicePersona || "Not configured"}
- Main goal: ${runtime.businessIdentity.mainGoal || "Not configured"}
- Business phone: ${runtime.businessIdentity.businessPhone || "Not configured"}
- Website: ${runtime.businessIdentity.website || "Not configured"}
- Opening hours: ${runtime.businessIdentity.openingHours || "Not configured"}
- Holiday/closed days: ${runtime.businessIdentity.holidayClosures || "Not configured"}
- Fallback contact: ${runtime.businessIdentity.fallbackContactMethod || "Not configured"}

REQUIRED GREETING
${runtime.businessIdentity.greetingMessage || "Thank you for calling. How can I help you today?"}

REQUIRED CLOSING
${runtime.businessIdentity.closingMessage || "Thank you for calling. We look forward to helping you soon."}

SERVICES OR MENU
${servicesSection}

FAQ KNOWLEDGE BASE
${faqSection}

BOOKING RULES
- Accepts bookings: ${runtime.bookingRules.acceptsBookings ? "Yes" : "No"}
- Booking type: ${labelize(runtime.bookingRules.bookingType)}
- Booking mode: ${labelize(runtime.bookingRules.bookingMode)}
- Required fields:
${formatList(runtime.bookingRules.requiredFields.map(labelize))}
- Max party size: ${runtime.bookingRules.maxPartySize ?? "Not configured"}
- Booking duration minutes: ${runtime.bookingRules.bookingDurationMinutes ?? "Not configured"}
- Advance booking limit hours: ${runtime.bookingRules.advanceBookingLimitHours ?? "Not configured"}
- Confirmation wording: ${runtime.bookingRules.confirmationMessage || "Tell the caller their request will be reviewed by staff."}
- Booking fallback: ${runtime.bookingRules.fallbackMessage || "If booking details are incomplete or unsupported, collect contact details and explain that staff will follow up."}

ORDER REQUEST RULES
- Accepts order requests: ${runtime.orderRules.acceptsOrderRequests ? "Yes" : "No"}
- Order mode: ${labelize(runtime.orderRules.orderMode)}
- Order types:
${formatList(runtime.orderRules.orderTypes.map(labelize))}
- Required fields:
${formatList(runtime.orderRules.requiredFields.map(labelize))}
- Allergy disclaimer: ${runtime.orderRules.allergyDisclaimer || "If allergies or dietary restrictions are mentioned, collect them carefully and tell the caller staff will review them."}
- Order confirmation wording: ${runtime.orderRules.confirmationWording || "Tell the caller the order request is saved for staff confirmation and not yet confirmed, prepared, or paid."}

HUMAN HANDOFF RULES
- Fallback phone: ${runtime.handoffRules.fallbackPhone || "Not configured"}
- Fallback email: ${runtime.handoffRules.fallbackEmail || "Not configured"}
- Staff notification note: ${runtime.handoffRules.staffNotificationPlaceholder || "No automatic staff notification is connected yet."}
- Handoff triggers:
${formatList(runtime.handoffRules.handoffTriggers.map(labelize))}

ALLOWED AI ACTIONS
${formatList(runtime.actionPolicy.allowedActions.map(labelize))}

BLOCKED AI ACTIONS
${formatList(runtime.actionPolicy.blockedActions.map(labelize))}

CRITICAL OPERATING RULES
1. Never access or mention another business.
2. Never fabricate hours, availability, menu items, or policies.
3. If something is not configured, say so politely and offer to capture details or hand off.
4. Never take payments, issue refunds, create invoices, delete records, or change ERP financial data.
5. Never confirm bookings or orders as finalized unless backend support is explicitly enabled. It is currently ${
    runtime.actionPolicy.backendAutoConfirmationEnabled ? "enabled" : "disabled"
  }.
6. ERP writes are ${runtime.actionPolicy.erpWritesEnabled ? "enabled" : "disabled"} and should remain disabled unless a specific backend write flow exists.
7. For angry callers, pricing disputes, refund requests, complex bookings, order issues, medical questions, legal questions, financial advice, or unknown answers, collect safe details and hand off according to the configured rules.
8. Match the caller's language whenever possible, especially English, Urdu, or Roman Urdu.

TOOL USAGE RULES
- This call belongs only to agent "${runtime.agent.name}" for this specific business. Never guess another tenant or agent.
- Use lookup_faq only for active business FAQs.
- Use get_business_hours for configured hours.
- Use request_appointment only if bookings are accepted and always follow required field collection.
- Use create_order_request only if order requests are accepted and always follow required field collection.
- Use handoff_to_staff when a configured trigger is hit or an answer is unknown.
- Use capture_lead for general inquiries, callbacks, or follow-up requests when a specific workflow does not apply.
- Use summarize_call at the end of a successful interaction.

ENABLED TOOL LIST FOR THIS AGENT
${formatList(runtime.agent.allowedTools)}
`;
}
