import { prisma } from "@/lib/prisma";
import { buildBusinessSpecificReceptionistPrompt } from "@/modules/voice/training/prompt-builder";
import { parseJsonArray } from "@/modules/voice/training/schema";
import { getVapiEnvStatus, syncVapiAssistantPrompt } from "@/modules/voice/vapi/service";

const DEFAULT_ALLOWED_ACTIONS = [
  "ANSWER_FAQS",
  "CAPTURE_LEADS",
  "CREATE_CALLBACK_REQUEST",
  "CREATE_TABLE_BOOKING_REQUEST",
  "CREATE_APPOINTMENT_REQUEST",
  "CREATE_ORDER_REQUEST",
  "SUMMARIZE_CALL",
  "HANDOFF_TO_STAFF",
  "ERP_WRITES_DISABLED_UNLESS_PACKAGE_ALLOWS",
] as const;

const DEFAULT_BLOCKED_ACTIONS = [
  "TAKE_PAYMENTS",
  "CONFIRM_PAID_ORDERS",
  "ISSUE_REFUNDS",
  "CANCEL_BOOKINGS",
  "CREATE_INVOICES",
  "DELETE_RECORDS",
  "CHANGE_ERP_FINANCIAL_DATA",
  "GIVE_MEDICAL_LEGAL_FINANCIAL_ADVICE",
  "PROMISE_DELIVERY_TIME_WITHOUT_CONFIGURED_RULE",
] as const;

const DEFAULT_HANDOFF_TRIGGERS = [
  "ANGRY_CUSTOMER",
  "PRICING_DISPUTE",
  "REFUND",
  "COMPLEX_BOOKING",
  "ORDER_ISSUE",
  "MEDICAL_LEGAL_FINANCIAL_QUESTION",
  "UNKNOWN_ANSWER",
] as const;

export async function getVoiceTrainingWorkspace(orgId: string, options?: { voiceAgentId?: string | null }) {
  const [
    businessProfile,
    receptionistSettings,
    trainingProfile,
    voiceAgent,
    serviceItems,
    bookingRules,
    orderRules,
    handoffRules,
    actionPolicy,
    knowledgeBaseItems,
    integrationSettings,
  ] = await Promise.all([
    prisma.voiceBusinessProfile.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceReceptionistSettings.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceBusinessTrainingProfile.findUnique({ where: { organizationId: orgId } }),
    options?.voiceAgentId
      ? prisma.voiceAgent.findFirst({
          where: { organizationId: orgId, id: options.voiceAgentId },
        })
      : prisma.voiceAgent.findFirst({
          where: { organizationId: orgId, isDefault: true },
          orderBy: { createdAt: "asc" },
        }),
    prisma.voiceServiceItem.findMany({ where: { organizationId: orgId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.voiceBookingRules.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceOrderRules.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceHandoffRules.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceAllowedActionPolicy.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceKnowledgeBaseItem.findMany({ where: { organizationId: orgId }, orderBy: { updatedAt: "desc" } }),
    prisma.voiceIntegrationSettings.findUnique({ where: { organizationId: orgId } }),
  ]);

  const runtime = buildVoiceTrainingRuntime({
    businessProfile,
    receptionistSettings,
    trainingProfile,
    voiceAgent,
    serviceItems,
    bookingRules,
    orderRules,
    handoffRules,
    actionPolicy,
    knowledgeBaseItems,
    integrationSettings,
  });

  return {
    businessProfile,
    receptionistSettings,
    trainingProfile,
    voiceAgent,
    serviceItems,
    bookingRules,
    orderRules,
    handoffRules,
    actionPolicy,
    knowledgeBaseItems,
    integrationSettings,
    runtime,
    promptPreview: buildBusinessSpecificReceptionistPrompt(runtime),
    toolConfigurationSummary: buildToolConfigurationSummary(runtime),
    setupChecklist: buildTrainingChecklist(runtime, voiceAgent?.vapiAssistantId ?? null),
  };
}

export function buildVoiceTrainingRuntime(workspace: {
  businessProfile: Awaited<ReturnType<typeof prisma.voiceBusinessProfile.findUnique>>;
  receptionistSettings: Awaited<ReturnType<typeof prisma.voiceReceptionistSettings.findUnique>>;
  trainingProfile: Awaited<ReturnType<typeof prisma.voiceBusinessTrainingProfile.findUnique>>;
  voiceAgent: Awaited<ReturnType<typeof prisma.voiceAgent.findFirst>>;
  serviceItems: Awaited<ReturnType<typeof prisma.voiceServiceItem.findMany>>;
  bookingRules: Awaited<ReturnType<typeof prisma.voiceBookingRules.findUnique>>;
  orderRules: Awaited<ReturnType<typeof prisma.voiceOrderRules.findUnique>>;
  handoffRules: Awaited<ReturnType<typeof prisma.voiceHandoffRules.findUnique>>;
  actionPolicy: Awaited<ReturnType<typeof prisma.voiceAllowedActionPolicy.findUnique>>;
  knowledgeBaseItems: Awaited<ReturnType<typeof prisma.voiceKnowledgeBaseItem.findMany>>;
  integrationSettings: Awaited<ReturnType<typeof prisma.voiceIntegrationSettings.findUnique>>;
}) {
  const handoffTriggers = parseJsonArray(workspace.handoffRules?.handoffTriggers);
  const allowedActions = parseJsonArray(workspace.actionPolicy?.allowedActions);
  const blockedActions = parseJsonArray(workspace.actionPolicy?.blockedActions);
  const agentSupportedLanguages = parseJsonArray(workspace.voiceAgent?.supportedLanguages);
  const trainingSupportedLanguages = parseJsonArray(workspace.trainingProfile?.supportedLanguages);
  const allowedTools = parseJsonArray(workspace.voiceAgent?.allowedTools);

  return {
    businessIdentity: {
      businessName: workspace.businessProfile?.businessName || "WhatsQuery Voice Business",
      industry: workspace.businessProfile?.industry || "Service business",
      locationCity: workspace.trainingProfile?.locationCity || null,
      shortDescription: workspace.trainingProfile?.shortDescription || null,
      primaryLanguage: workspace.trainingProfile?.primaryLanguage || workspace.businessProfile?.preferredLanguage || "AUTO_DETECT",
      supportedLanguages:
        trainingSupportedLanguages.length > 0
          ? trainingSupportedLanguages
          : [workspace.businessProfile?.preferredLanguage || "AUTO_DETECT"],
      tone: workspace.trainingProfile?.tone || "PROFESSIONAL",
      greetingMessage: workspace.businessProfile?.greetingMessage || workspace.receptionistSettings?.greetingMessage || null,
      closingMessage: workspace.trainingProfile?.closingMessage || workspace.receptionistSettings?.fallbackMessage || null,
      openingHours: workspace.receptionistSettings?.businessHours || workspace.businessProfile?.openingHours || null,
      holidayClosures: workspace.trainingProfile?.holidayClosures || null,
      fallbackContactMethod: workspace.businessProfile?.fallbackContactMethod || null,
      businessPhone: workspace.businessProfile?.businessPhone || null,
      website: workspace.businessProfile?.website || null,
      mainGoal: workspace.businessProfile?.mainGoal || null,
    },
    agent: {
      id: workspace.voiceAgent?.id || null,
      name: workspace.voiceAgent?.name || workspace.receptionistSettings?.receptionistName || "WhatsQuery Receptionist",
      role: workspace.voiceAgent?.role || "AI_RECEPTIONIST",
      languageMode: workspace.voiceAgent?.languageMode || workspace.trainingProfile?.primaryLanguage || workspace.businessProfile?.preferredLanguage || "AUTO_DETECT",
      supportedLanguages:
        agentSupportedLanguages.length > 0
          ? agentSupportedLanguages
          : trainingSupportedLanguages.length > 0
            ? trainingSupportedLanguages
            : [workspace.businessProfile?.preferredLanguage || "AUTO_DETECT"],
      tone: workspace.voiceAgent?.tone || workspace.trainingProfile?.tone || "PROFESSIONAL",
      voicePersona: workspace.voiceAgent?.voicePersona || null,
      allowedTools: allowedTools.length > 0 ? allowedTools : [],
      assistantId: workspace.voiceAgent?.vapiAssistantId || null,
      assistantName: workspace.voiceAgent?.vapiAssistantName || null,
      phoneNumberId: workspace.voiceAgent?.vapiPhoneNumberId || null,
      isDefault: workspace.voiceAgent?.isDefault ?? false,
      isActive: workspace.voiceAgent?.isActive ?? false,
      lastPromptSyncedAt: workspace.voiceAgent?.lastPromptSyncedAt || null,
    },
    services: workspace.serviceItems,
    knowledgeBase: workspace.knowledgeBaseItems,
    bookingRules: {
      acceptsBookings: workspace.bookingRules?.acceptsBookings ?? false,
      bookingType: workspace.bookingRules?.bookingType || "APPOINTMENT",
      bookingMode: workspace.bookingRules?.bookingMode || "REQUEST_ONLY",
      requiredFields: parseJsonArray(workspace.bookingRules?.requiredFields),
      maxPartySize: workspace.bookingRules?.maxPartySize ?? null,
      bookingDurationMinutes: workspace.bookingRules?.bookingDurationMinutes ?? null,
      advanceBookingLimitHours: workspace.bookingRules?.advanceBookingLimitHours ?? null,
      confirmationMessage: workspace.bookingRules?.confirmationMessage || null,
      fallbackMessage: workspace.bookingRules?.fallbackMessage || null,
    },
    orderRules: {
      acceptsOrderRequests: workspace.orderRules?.acceptsOrderRequests ?? false,
      orderMode: workspace.orderRules?.orderMode || "REQUEST_ONLY",
      orderTypes: parseJsonArray(workspace.orderRules?.orderTypes),
      requiredFields: parseJsonArray(workspace.orderRules?.requiredFields),
      allergyDisclaimer: workspace.orderRules?.allergyDisclaimer || null,
      confirmationWording: workspace.orderRules?.confirmationWording || null,
    },
    handoffRules: {
      fallbackPhone: workspace.handoffRules?.fallbackPhone || workspace.businessProfile?.businessPhone || null,
      fallbackEmail: workspace.handoffRules?.fallbackEmail || null,
      staffNotificationPlaceholder: workspace.handoffRules?.staffNotificationPlaceholder || null,
      handoffTriggers: handoffTriggers.length > 0 ? handoffTriggers : [...DEFAULT_HANDOFF_TRIGGERS],
    },
    actionPolicy: {
      allowedActions: allowedActions.length > 0 ? allowedActions : [...DEFAULT_ALLOWED_ACTIONS],
      blockedActions: blockedActions.length > 0 ? blockedActions : [...DEFAULT_BLOCKED_ACTIONS],
      erpWritesEnabled: workspace.actionPolicy?.erpWritesEnabled ?? false,
      backendAutoConfirmationEnabled: workspace.actionPolicy?.backendAutoConfirmationEnabled ?? false,
    },
    vapiMapping: {
      assistantId: workspace.voiceAgent?.vapiAssistantId || null,
      phoneNumberId: workspace.voiceAgent?.vapiPhoneNumberId || null,
      webhookUrl: workspace.integrationSettings?.vapiWebhookUrl || getVapiEnvStatus().webhookUrl || null,
      webhookSecretConfigured: getVapiEnvStatus().hasWebhookSecret,
      lastPromptSyncedAt: workspace.voiceAgent?.lastPromptSyncedAt || workspace.trainingProfile?.lastPromptSyncedAt || null,
      callingEnabled: getVapiEnvStatus().callingEnabled,
    },
  };
}

function buildToolConfigurationSummary(runtime: ReturnType<typeof buildVoiceTrainingRuntime>) {
  return {
    faqLookupEnabled: runtime.actionPolicy.allowedActions.includes("ANSWER_FAQS") && runtime.knowledgeBase.some((item) => item.isActive),
    businessHoursEnabled: Boolean(runtime.businessIdentity.openingHours),
    bookingRequestEnabled:
      runtime.actionPolicy.allowedActions.some((action) => action.includes("BOOKING") || action.includes("APPOINTMENT")) &&
      runtime.bookingRules.acceptsBookings,
    orderRequestEnabled:
      runtime.actionPolicy.allowedActions.includes("CREATE_ORDER_REQUEST") &&
      runtime.orderRules.acceptsOrderRequests,
    handoffEnabled: runtime.actionPolicy.allowedActions.includes("HANDOFF_TO_STAFF"),
    callbackCaptureEnabled:
      runtime.actionPolicy.allowedActions.includes("CREATE_CALLBACK_REQUEST") ||
      runtime.actionPolicy.allowedActions.includes("CAPTURE_LEADS"),
  };
}

function buildTrainingChecklist(runtime: ReturnType<typeof buildVoiceTrainingRuntime>, assistantId: string | null) {
  return [
    { label: "Business identity", complete: Boolean(runtime.businessIdentity.businessName && runtime.businessIdentity.industry) },
    { label: "Receptionist messages", complete: Boolean(runtime.businessIdentity.greetingMessage && runtime.businessIdentity.closingMessage) },
    { label: "Business hours", complete: Boolean(runtime.businessIdentity.openingHours) },
    { label: "Services or menu", complete: runtime.services.length > 0 },
    { label: "FAQs", complete: runtime.knowledgeBase.some((item) => item.isActive) },
    { label: "Booking rules", complete: runtime.bookingRules.acceptsBookings || runtime.orderRules.acceptsOrderRequests },
    { label: "Action policy", complete: runtime.actionPolicy.allowedActions.length > 0 && runtime.actionPolicy.blockedActions.length > 0 },
    { label: "Default voice agent", complete: Boolean(runtime.agent.id) },
    { label: "Vapi assistant mapping", complete: Boolean(assistantId) },
  ];
}

export async function syncVoiceTrainingPromptToVapi(orgId: string, options?: { voiceAgentId?: string | null }) {
  const workspace = await getVoiceTrainingWorkspace(orgId, options);
  const assistantId = workspace.voiceAgent?.vapiAssistantId;

  if (!assistantId) {
    throw new Error("No Vapi assistant ID is configured for the selected voice agent yet.");
  }

  const prompt = workspace.promptPreview;
  await syncVapiAssistantPrompt(assistantId, prompt);

  await prisma.voiceBusinessTrainingProfile.upsert({
    where: { organizationId: orgId },
    update: { lastPromptSyncedAt: new Date() },
    create: {
      organizationId: orgId,
      primaryLanguage: workspace.runtime.businessIdentity.primaryLanguage,
      supportedLanguages: JSON.stringify(workspace.runtime.businessIdentity.supportedLanguages),
      tone: workspace.runtime.businessIdentity.tone,
      lastPromptSyncedAt: new Date(),
    },
  });

  if (workspace.voiceAgent?.id) {
    await prisma.voiceAgent.update({
      where: { id: workspace.voiceAgent.id },
      data: { lastPromptSyncedAt: new Date() },
    });
  }

  return {
    assistantId,
    voiceAgentId: workspace.voiceAgent?.id || null,
    voiceAgentName: workspace.voiceAgent?.name || null,
    syncedAt: new Date().toISOString(),
    prompt,
  };
}

export async function getVoiceTrainingRuntime(orgId: string) {
  const workspace = await getVoiceTrainingWorkspace(orgId);
  return workspace.runtime;
}
