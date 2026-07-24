import { prisma } from "@/lib/prisma";
import { parseJsonArray, voiceAllowedActionOptions } from "@/modules/voice/training/schema";

const DEFAULT_AGENT_NAME = "Main Receptionist";
const DEFAULT_AGENT_ROLE = "CAFE_RESTAURANT_AI_RECEPTIONIST";
const DEFAULT_AGENT_LANGUAGE_MODE = "AUTO_DETECT";
const DEFAULT_AGENT_TONE = "PAKISTANI_POLITE";
const DEFAULT_AGENT_VOICE_PERSONA = "Pakistani polite, professional";
const DEFAULT_AGENT_SUPPORTED_LANGUAGES = ["ENGLISH", "URDU", "ROMAN_URDU"] as const;
const DEFAULT_AGENT_ALLOWED_TOOLS = [
  "lookup_faq",
  "get_business_hours",
  "capture_lead",
  "request_appointment",
  "create_order_request",
  "get_fallback_contact",
  "summarize_call",
  "handoff_to_staff",
] as const;

const DEFAULT_AGENT_ENVIRONMENT = "PROD";

function slugifySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCompactTrackingSegment(value: string) {
  return value
    .trim()
    .replace(/[^A-Za-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function getVoiceAgentEnvironment() {
  return process.env.VOICE_RUNTIME_ENVIRONMENT?.trim().toUpperCase() || DEFAULT_AGENT_ENVIRONMENT;
}

export function getDefaultVoiceAgentName(businessName?: string | null) {
  return businessName?.trim() ? `${businessName.trim()} ${DEFAULT_AGENT_NAME}` : DEFAULT_AGENT_NAME;
}

export function getVoiceAgentBusinessSlug(businessName?: string | null) {
  return businessName?.trim() ? slugifySegment(businessName) : null;
}

export function getVoiceAgentSlug(agentName?: string | null) {
  return agentName?.trim() ? slugifySegment(agentName) : null;
}

export function getVoiceAgentDisplayName(businessName?: string | null, agentName?: string | null) {
  const safeBusinessName = businessName?.trim();
  const safeAgentName = agentName?.trim() || DEFAULT_AGENT_NAME;
  return safeBusinessName ? `${safeBusinessName} ${safeAgentName}` : safeAgentName;
}

export function getVoiceAgentInternalKey(params: {
  businessSlug?: string | null;
  agentSlug?: string | null;
  environment?: string | null;
}) {
  if (!params.businessSlug || !params.agentSlug) return null;
  return `${params.businessSlug}-${params.agentSlug}-${(params.environment || DEFAULT_AGENT_ENVIRONMENT).toLowerCase()}`;
}

export function getVapiAssistantTrackingName(params: {
  businessSlug?: string | null;
  agentSlug?: string | null;
  environment?: string | null;
}) {
  if (!params.businessSlug || !params.agentSlug) return null;
  return `WQ | ${toCompactTrackingSegment(params.businessSlug)} | ${toCompactTrackingSegment(params.agentSlug)} | ${(params.environment || DEFAULT_AGENT_ENVIRONMENT).toUpperCase()}`;
}

export function getVapiPhoneTrackingName(params: {
  businessSlug?: string | null;
  phonePurpose?: string | null;
  environment?: string | null;
}) {
  if (!params.businessSlug || !params.phonePurpose) return null;
  return `WQ | ${toCompactTrackingSegment(params.businessSlug)} | ${toCompactTrackingSegment(params.phonePurpose)} | ${(params.environment || DEFAULT_AGENT_ENVIRONMENT).toUpperCase()}`;
}

export function getVoiceAgentAllowedTools(raw: string | null | undefined) {
  const parsed = parseJsonArray(raw);
  return parsed.length > 0 ? parsed : [...DEFAULT_AGENT_ALLOWED_TOOLS];
}

export function getVoiceAgentBootstrapPhoneNumberId() {
  return process.env.VOICE_BOOTSTRAP_PHONE_NUMBER_ID || null;
}

export async function listVoiceAgents(organizationId: string) {
  return prisma.voiceAgent.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function getDefaultVoiceAgent(organizationId: string) {
  return prisma.voiceAgent.findFirst({
    where: { organizationId, isDefault: true, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function ensureDefaultVoiceAgent(organizationId: string) {
  const [existingDefaultAgent, existingAnyAgent, businessProfile, trainingProfile, integrationSettings] = await Promise.all([
    prisma.voiceAgent.findFirst({
      where: { organizationId, isDefault: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.voiceAgent.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.voiceBusinessProfile.findUnique({
      where: { organizationId },
      select: { id: true, businessName: true },
    }),
    prisma.voiceBusinessTrainingProfile.findUnique({
      where: { organizationId },
      select: { id: true },
    }),
    prisma.voiceIntegrationSettings.findUnique({
      where: { organizationId },
      select: {
        vapiAssistantId: true,
        vapiAssistantName: true,
        vapiPhoneNumberId: true,
      },
    }),
  ]);

  const bootstrapPhoneNumberId = getVoiceAgentBootstrapPhoneNumberId();
  const defaultAgentSource = existingDefaultAgent || existingAnyAgent;
  const businessAwareAgentName = getDefaultVoiceAgentName(businessProfile?.businessName);
  const displayName = getVoiceAgentDisplayName(businessProfile?.businessName, DEFAULT_AGENT_NAME);
  const businessSlug = getVoiceAgentBusinessSlug(businessProfile?.businessName);
  const agentSlug = getVoiceAgentSlug(DEFAULT_AGENT_NAME);
  const environment = getVoiceAgentEnvironment();
  const internalName = getVoiceAgentInternalKey({ businessSlug, agentSlug, environment });
  const vapiAssistantName = getVapiAssistantTrackingName({ businessSlug, agentSlug, environment });
  const vapiPhoneNumberName = getVapiPhoneTrackingName({ businessSlug, phonePurpose: "main-line", environment });

  if (defaultAgentSource) {
    const existingBusinessSlug = defaultAgentSource.businessSlug || businessSlug;
    const existingAgentSlug = defaultAgentSource.agentSlug || getVoiceAgentSlug(defaultAgentSource.displayName || defaultAgentSource.name || DEFAULT_AGENT_NAME);
    const existingEnvironment = defaultAgentSource.environment || environment;
    const updated = await prisma.voiceAgent.update({
      where: { id: defaultAgentSource.id },
      data: {
        isDefault: true,
        voiceBusinessProfileId: defaultAgentSource.voiceBusinessProfileId || businessProfile?.id || null,
        trainingProfileId: defaultAgentSource.trainingProfileId || trainingProfile?.id || null,
        name:
          defaultAgentSource.name === "WhatsQuery Demo Cafe Receptionist"
            ? businessAwareAgentName
            : defaultAgentSource.name || businessAwareAgentName,
        displayName: defaultAgentSource.displayName || displayName,
        businessSlug: existingBusinessSlug,
        agentSlug: existingAgentSlug,
        environment: existingEnvironment,
        internalName:
          defaultAgentSource.internalName ||
          getVoiceAgentInternalKey({
            businessSlug: existingBusinessSlug,
            agentSlug: existingAgentSlug,
            environment: existingEnvironment,
          }),
        role: defaultAgentSource.role || DEFAULT_AGENT_ROLE,
        languageMode: defaultAgentSource.languageMode || DEFAULT_AGENT_LANGUAGE_MODE,
        supportedLanguages:
          defaultAgentSource.supportedLanguages || JSON.stringify([...DEFAULT_AGENT_SUPPORTED_LANGUAGES]),
        tone: defaultAgentSource.tone || DEFAULT_AGENT_TONE,
        voicePersona: defaultAgentSource.voicePersona || DEFAULT_AGENT_VOICE_PERSONA,
        allowedTools: defaultAgentSource.allowedTools || JSON.stringify([...DEFAULT_AGENT_ALLOWED_TOOLS]),
        vapiAssistantId: defaultAgentSource.vapiAssistantId || integrationSettings?.vapiAssistantId || null,
        vapiAssistantName:
          defaultAgentSource.vapiAssistantName ||
          integrationSettings?.vapiAssistantName ||
          getVapiAssistantTrackingName({
            businessSlug: existingBusinessSlug,
            agentSlug: existingAgentSlug,
            environment: existingEnvironment,
          }),
        vapiPhoneNumberName:
          defaultAgentSource.vapiPhoneNumberName ||
          getVapiPhoneTrackingName({
            businessSlug: existingBusinessSlug,
            phonePurpose: "main-line",
            environment: existingEnvironment,
          }),
        vapiPhoneNumberId:
          defaultAgentSource.vapiPhoneNumberId || bootstrapPhoneNumberId || integrationSettings?.vapiPhoneNumberId || null,
      },
    });

    if (existingAnyAgent && existingAnyAgent.id !== updated.id) {
      await prisma.voiceAgent.updateMany({
        where: { organizationId, NOT: { id: updated.id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    return updated;
  }

  return prisma.voiceAgent.create({
    data: {
      organizationId,
      voiceBusinessProfileId: businessProfile?.id || null,
      trainingProfileId: trainingProfile?.id || null,
      name: businessAwareAgentName,
      displayName,
      businessSlug,
      agentSlug,
      environment,
      internalName,
      role: DEFAULT_AGENT_ROLE,
      languageMode: DEFAULT_AGENT_LANGUAGE_MODE,
      supportedLanguages: JSON.stringify([...DEFAULT_AGENT_SUPPORTED_LANGUAGES]),
      tone: DEFAULT_AGENT_TONE,
      voicePersona: DEFAULT_AGENT_VOICE_PERSONA,
      allowedTools: JSON.stringify([...DEFAULT_AGENT_ALLOWED_TOOLS]),
      vapiAssistantId: integrationSettings?.vapiAssistantId || null,
      vapiAssistantName: integrationSettings?.vapiAssistantName || vapiAssistantName,
      vapiPhoneNumberName,
      vapiPhoneNumberId: bootstrapPhoneNumberId || integrationSettings?.vapiPhoneNumberId || null,
      isDefault: true,
      isActive: true,
    },
  });
}

export async function resolveVoiceAgentForWebhook({
  assistantId,
  phoneNumberId,
  inboundNumber,
  providerCallId,
  tenantHeader,
}: {
  assistantId?: string;
  phoneNumberId?: string;
  inboundNumber?: string;
  providerCallId?: string;
  tenantHeader?: string | null;
}) {
  if (phoneNumberId) {
    const agent = await prisma.voiceAgent.findUnique({
      where: { vapiPhoneNumberId: phoneNumberId },
      select: {
        id: true,
        organizationId: true,
        voiceBusinessProfileId: true,
        vapiAssistantId: true,
        isActive: true,
      },
    });
    if (agent?.isActive) {
      return {
        organizationId: agent.organizationId,
        voiceBusinessProfileId: agent.voiceBusinessProfileId || null,
        voiceAgentId: agent.id,
        vapiAssistantId: agent.vapiAssistantId || null,
        resolvedBy: "phone_number_id" as const,
      };
    }
  }

  if (inboundNumber) {
    const matches = await prisma.voiceAgent.findMany({
      where: {
        isActive: true,
        OR: [
          { assignedVapiPhoneNumber: inboundNumber },
          { clientPublicPhoneNumber: inboundNumber },
        ],
      },
      select: {
        id: true,
        organizationId: true,
        voiceBusinessProfileId: true,
        vapiAssistantId: true,
      },
      take: 2,
    });
    if (matches.length === 1) {
      return {
        organizationId: matches[0].organizationId,
        voiceBusinessProfileId: matches[0].voiceBusinessProfileId || null,
        voiceAgentId: matches[0].id,
        vapiAssistantId: matches[0].vapiAssistantId || null,
        resolvedBy: "inbound_number" as const,
      };
    }
    if (matches.length > 1) {
      console.warn("[Voice Agent Mapping] Multiple active agents matched the same inbound number.");
      return undefined;
    }
  }

  if (assistantId) {
    const agent = await prisma.voiceAgent.findUnique({
      where: { vapiAssistantId: assistantId },
      select: {
        id: true,
        organizationId: true,
        voiceBusinessProfileId: true,
        vapiAssistantId: true,
        isActive: true,
      },
    });
    if (agent?.isActive) {
      return {
        organizationId: agent.organizationId,
        voiceBusinessProfileId: agent.voiceBusinessProfileId || null,
        voiceAgentId: agent.id,
        vapiAssistantId: agent.vapiAssistantId || null,
        resolvedBy: "assistant_id" as const,
      };
    }
  }

  if (providerCallId) {
    const existingCall = await prisma.voiceCallLog.findFirst({
      where: { provider: "vapi", providerCallId },
      select: {
        organizationId: true,
        voiceAgentId: true,
        voiceBusinessProfileId: true,
        providerAssistantId: true,
      },
    });

    if (existingCall?.organizationId) {
      return {
        organizationId: existingCall.organizationId,
        voiceBusinessProfileId: existingCall.voiceBusinessProfileId || null,
        voiceAgentId: existingCall.voiceAgentId || null,
        vapiAssistantId: existingCall.providerAssistantId || null,
        resolvedBy: "existing_call" as const,
      };
    }
  }

  if (process.env.NODE_ENV !== "production" && tenantHeader) {
    const agent = await ensureDefaultVoiceAgent(tenantHeader);
    return {
      organizationId: tenantHeader,
      voiceAgentId: agent.id,
      voiceBusinessProfileId: agent.voiceBusinessProfileId || null,
      vapiAssistantId: agent.vapiAssistantId || null,
      resolvedBy: "development_tenant_header" as const,
    };
  }

  return undefined;
}

export function getDefaultVoiceActionPolicyAllowedTools() {
  return voiceAllowedActionOptions.filter((value) => value !== "ERP_WRITES_DISABLED_UNLESS_PACKAGE_ALLOWS");
}
