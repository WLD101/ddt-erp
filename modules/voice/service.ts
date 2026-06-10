import { prisma } from "@/lib/prisma";
import { listVoiceAgents } from "@/modules/voice/agents/service";
import { checkUsageLimits } from "@/modules/voice/billing/usage";
import { parseLeadCaptureFields } from "@/modules/voice/schema";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";

const RESERVATION_KEYWORDS = ["reservation", "booking", "table", "appointment"];
const ORDER_KEYWORDS = ["order", "takeaway", "pickup", "delivery", "burger", "meal", "food"];
const CALLBACK_KEYWORDS = ["callback", "call back", "human", "staff", "support", "handoff"];

type VoiceLeadListItem = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  reasonForCall: string | null;
  status: string;
  notes: string | null;
  source: string;
  appointmentRequested: boolean;
  createdAt: Date;
};

type VoiceQueueRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  reasonForCall: string | null;
  status: string;
  notes: string | null;
  source: string;
  createdAt: Date;
};

function textHasKeyword(value: string | null | undefined, keywords: string[]) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function isReservationLead(lead: Pick<VoiceLeadListItem, "appointmentRequested" | "source" | "reasonForCall" | "notes">) {
  return (
    lead.appointmentRequested ||
    lead.source === "VAPI_TABLE_REQUEST" ||
    textHasKeyword(lead.reasonForCall, RESERVATION_KEYWORDS) ||
    textHasKeyword(lead.notes, RESERVATION_KEYWORDS)
  );
}

export function isOrderLead(lead: Pick<VoiceLeadListItem, "source" | "reasonForCall" | "notes">) {
  return (
    lead.source === "VAPI_ORDER_REQUEST" ||
    textHasKeyword(lead.reasonForCall, ORDER_KEYWORDS) ||
    textHasKeyword(lead.notes, ORDER_KEYWORDS)
  );
}

export function isCallbackLead(lead: Pick<VoiceLeadListItem, "source" | "reasonForCall" | "notes">) {
  return (
    lead.source === "VAPI_HANDOFF_REQUEST" ||
    textHasKeyword(lead.reasonForCall, CALLBACK_KEYWORDS) ||
    textHasKeyword(lead.notes, CALLBACK_KEYWORDS)
  );
}

export async function getVoiceWorkspace(orgId: string) {
  const [businessProfile, receptionistSettings, knowledgeBaseItems, leads, callLogs, integrationSettings, voiceAgents] =
    await Promise.all([
      prisma.voiceBusinessProfile.findUnique({ where: { organizationId: orgId } }),
      prisma.voiceReceptionistSettings.findUnique({ where: { organizationId: orgId } }),
      prisma.voiceKnowledgeBaseItem.findMany({
        where: { organizationId: orgId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.voiceLead.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.voiceCallLog.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.voiceIntegrationSettings.findUnique({ where: { organizationId: orgId } }),
      listVoiceAgents(orgId),
    ]);

  return {
    businessProfile,
    receptionistSettings,
    knowledgeBaseItems,
    leads,
    callLogs,
    integrationSettings,
    voiceAgents,
  };
}

export async function getVoiceDashboardSummary(orgId: string) {
  const [
    leads,
    businessProfile,
    receptionistSettings,
    integrationSettings,
    voiceAgents,
    totalCalls,
    missedCalls,
    appointmentRequestedCalls,
    knowledgeCount,
    reservationRequestCount,
    orderRequestCount,
    usage,
  ] = await Promise.all([
    prisma.voiceLead.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        reasonForCall: true,
        status: true,
        notes: true,
        source: true,
        appointmentRequested: true,
        createdAt: true,
      },
    }),
    prisma.voiceBusinessProfile.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceReceptionistSettings.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceIntegrationSettings.findUnique({ where: { organizationId: orgId } }),
    listVoiceAgents(orgId),
    prisma.voiceCallLog.count({ where: { organizationId: orgId } }),
    prisma.voiceCallLog.count({ where: { organizationId: orgId, isMissed: true } }),
    prisma.voiceCallLog.count({ where: { organizationId: orgId, appointmentRequested: true } }),
    prisma.voiceKnowledgeBaseItem.count({
      where: { organizationId: orgId, isActive: true },
    }),
    prisma.voiceReservationRequest.count({ where: { organizationId: orgId } }),
    prisma.voiceOrderRequest.count({ where: { organizationId: orgId } }),
    checkUsageLimits(orgId),
  ]);

  const reservationLeads = leads.filter(isReservationLead);
  const orderRequestLeads = leads.filter(isOrderLead);
  const callbackLeads = leads.filter(isCallbackLead);
  const defaultAgent = voiceAgents.find((agent) => agent.isDefault) || voiceAgents[0] || null;

  const setupChecklist = [
    { label: "Business profile", complete: !!businessProfile },
    {
      label: "Receptionist settings",
      complete: !!receptionistSettings?.greetingMessage && !!receptionistSettings?.fallbackMessage,
    },
    { label: "Knowledge base", complete: knowledgeCount > 0 },
    { label: "Default voice agent", complete: !!defaultAgent },
    { label: "Integrations", complete: !!defaultAgent?.vapiAssistantId && !!defaultAgent?.vapiPhoneNumberId },
  ];

  return {
    businessProfile,
    receptionistSettings,
    integrationSettings,
    voiceAgents,
    defaultAgent,
    stats: {
      totalLeads: leads.length,
      totalCalls,
      missedCalls,
      appointmentsRequested: appointmentRequestedCalls + reservationRequestCount + reservationLeads.length,
      orderRequests: orderRequestCount + orderRequestLeads.length,
      callbackRequests: callbackLeads.length,
      activeKnowledgeItems: knowledgeCount,
    },
    usage: {
      callsThisMonth: usage.meter.callsThisMonth,
      minutesThisMonth: usage.meter.callMinutesThisMonth,
      estimatedCostUsdThisMonth: usage.meter.callCostUsdThisMonth,
      limit: usage.limit,
      remaining: usage.remaining,
      warnings: usage.warnings,
      showEstimatedCost: usage.showEstimatedCost,
    },
    setupChecklist,
  };
}

export async function getVoiceOnboardingData(orgId: string) {
  const [businessProfile, receptionistSettings, organization] = await Promise.all([
    prisma.voiceBusinessProfile.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceReceptionistSettings.findUnique({ where: { organizationId: orgId } }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, industryType: true, phone: true } }),
  ]);

  return { businessProfile, receptionistSettings, organization };
}

export async function getVoiceSettingsData(orgId: string) {
  const receptionistSettings = await prisma.voiceReceptionistSettings.findUnique({
    where: { organizationId: orgId },
  });

  return {
    receptionistSettings,
    leadCaptureFields: parseLeadCaptureFields(receptionistSettings?.leadCaptureFields),
  };
}

export async function getVoiceIntegrationsOverview(orgId: string) {
  const [settings, voiceAgents] = await Promise.all([
    prisma.voiceIntegrationSettings.findUnique({
      where: { organizationId: orgId },
    }),
    listVoiceAgents(orgId),
  ]);

  const vapiStatus = getVapiEnvStatus();
  const envStatus = {
    vapi: vapiStatus.hasPrivateKey && vapiStatus.hasPublicKey,
    twilio: !!process.env.VOICE_TWILIO_ACCOUNT_SID && !!process.env.VOICE_TWILIO_AUTH_TOKEN,
    googleCalendar: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    whatsapp: !!process.env.VOICE_WHATSAPP_FOLLOW_UP_WEBHOOK_URL,
  };

  return {
    settings,
    voiceAgents,
    envStatus,
  };
}

export async function getVoiceRequestQueues(orgId: string) {
  const [leads, reservationRequests, orderRequests] = await Promise.all([
    prisma.voiceLead.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.voiceReservationRequest.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.voiceOrderRequest.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const reservationRows: VoiceQueueRow[] = reservationRequests.map((request) => ({
    id: request.id,
    name: request.customerName || null,
    phone: request.customerPhone || null,
    email: null,
    reasonForCall: request.partySize
      ? `Table booking request for party of ${request.partySize}`
      : "Table booking request",
    status: request.status,
    notes: request.specialRequests || null,
    source: "VOICE_RESERVATION_REQUEST",
    createdAt: request.createdAt,
  }));

  const orderRows: VoiceQueueRow[] = orderRequests.map((request) => ({
    id: request.id,
    name: request.customerName || null,
    phone: request.customerPhone || null,
    email: null,
    reasonForCall: "Takeaway order request",
    status: request.status,
    notes: request.orderDetailsText,
    source: "VOICE_ORDER_REQUEST",
    createdAt: request.createdAt,
  }));

  return {
    reservations: [...reservationRows, ...leads.filter(isReservationLead)].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    ),
    orders: [...orderRows, ...leads.filter(isOrderLead)].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    ),
    callbacks: leads.filter(isCallbackLead),
  };
}
