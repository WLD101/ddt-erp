import { prisma } from "@/lib/prisma";
import { parseJsonArray, voiceAllowedActionOptions } from "@/modules/voice/training/schema";

const DEFAULT_AGENT_NAME = "WhatsQuery Demo Cafe Receptionist";
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

export function getDefaultVoiceAgentName() {
  return DEFAULT_AGENT_NAME;
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
      select: { id: true },
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

  if (defaultAgentSource) {
    const updated = await prisma.voiceAgent.update({
      where: { id: defaultAgentSource.id },
      data: {
        isDefault: true,
        businessProfileId: defaultAgentSource.businessProfileId || businessProfile?.id || null,
        trainingProfileId: defaultAgentSource.trainingProfileId || trainingProfile?.id || null,
        role: defaultAgentSource.role || DEFAULT_AGENT_ROLE,
        languageMode: defaultAgentSource.languageMode || DEFAULT_AGENT_LANGUAGE_MODE,
        supportedLanguages:
          defaultAgentSource.supportedLanguages || JSON.stringify([...DEFAULT_AGENT_SUPPORTED_LANGUAGES]),
        tone: defaultAgentSource.tone || DEFAULT_AGENT_TONE,
        voicePersona: defaultAgentSource.voicePersona || DEFAULT_AGENT_VOICE_PERSONA,
        allowedTools: defaultAgentSource.allowedTools || JSON.stringify([...DEFAULT_AGENT_ALLOWED_TOOLS]),
        vapiAssistantId: defaultAgentSource.vapiAssistantId || integrationSettings?.vapiAssistantId || null,
        vapiAssistantName: defaultAgentSource.vapiAssistantName || integrationSettings?.vapiAssistantName || null,
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
      businessProfileId: businessProfile?.id || null,
      trainingProfileId: trainingProfile?.id || null,
      name: DEFAULT_AGENT_NAME,
      role: DEFAULT_AGENT_ROLE,
      languageMode: DEFAULT_AGENT_LANGUAGE_MODE,
      supportedLanguages: JSON.stringify([...DEFAULT_AGENT_SUPPORTED_LANGUAGES]),
      tone: DEFAULT_AGENT_TONE,
      voicePersona: DEFAULT_AGENT_VOICE_PERSONA,
      allowedTools: JSON.stringify([...DEFAULT_AGENT_ALLOWED_TOOLS]),
      vapiAssistantId: integrationSettings?.vapiAssistantId || null,
      vapiAssistantName: integrationSettings?.vapiAssistantName || null,
      vapiPhoneNumberId: bootstrapPhoneNumberId || integrationSettings?.vapiPhoneNumberId || null,
      isDefault: true,
      isActive: true,
    },
  });
}

export async function resolveVoiceAgentForWebhook({
  assistantId,
  phoneNumberId,
  providerCallId,
  tenantHeader,
}: {
  assistantId?: string;
  phoneNumberId?: string;
  providerCallId?: string;
  tenantHeader?: string | null;
}) {
  const ors: Array<Record<string, string>> = [];

  if (assistantId) {
    ors.push({ vapiAssistantId: assistantId });
  }

  if (phoneNumberId) {
    ors.push({ vapiPhoneNumberId: phoneNumberId });
  }

  if (ors.length > 0) {
    const matches = await prisma.voiceAgent.findMany({
      where: {
        isActive: true,
        OR: ors,
      },
      select: { id: true, organizationId: true },
      take: 2,
    });

    if (matches.length === 1) {
      return {
        organizationId: matches[0].organizationId,
        voiceAgentId: matches[0].id,
      };
    }

    if (matches.length > 1) {
      console.warn("[Voice Agent Mapping] Multiple active agents matched the same assistant or phone number.");
      return undefined;
    }
  }

  if (providerCallId) {
    const existingCall = await prisma.voiceCallLog.findFirst({
      where: { providerCallId },
      select: { organizationId: true, voiceAgentId: true },
    });

    if (existingCall?.organizationId) {
      return {
        organizationId: existingCall.organizationId,
        voiceAgentId: existingCall.voiceAgentId || null,
      };
    }
  }

  if (process.env.NODE_ENV !== "production" && tenantHeader) {
    const agent = await ensureDefaultVoiceAgent(tenantHeader);
    return {
      organizationId: tenantHeader,
      voiceAgentId: agent.id,
    };
  }

  return undefined;
}

export function getDefaultVoiceActionPolicyAllowedTools() {
  return voiceAllowedActionOptions.filter((value) => value !== "ERP_WRITES_DISABLED_UNLESS_PACKAGE_ALLOWS");
}
