import { prisma } from "@/lib/prisma";
import { parseLeadCaptureFields } from "@/modules/voice/schema";

export async function getVoiceWorkspace(orgId: string) {
  const [businessProfile, receptionistSettings, knowledgeBaseItems, leads, callLogs, integrationSettings] =
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
    ]);

  return {
    businessProfile,
    receptionistSettings,
    knowledgeBaseItems,
    leads,
    callLogs,
    integrationSettings,
  };
}

export async function getVoiceDashboardSummary(orgId: string) {
  const [
    businessProfile,
    receptionistSettings,
    totalLeads,
    totalCalls,
    missedCalls,
    appointmentRequestedCalls,
    appointmentRequestedLeads,
    knowledgeCount,
  ] = await Promise.all([
    prisma.voiceBusinessProfile.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceReceptionistSettings.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceLead.count({ where: { organizationId: orgId } }),
    prisma.voiceCallLog.count({ where: { organizationId: orgId } }),
    prisma.voiceCallLog.count({ where: { organizationId: orgId, isMissed: true } }),
    prisma.voiceCallLog.count({ where: { organizationId: orgId, appointmentRequested: true } }),
    prisma.voiceLead.count({ where: { organizationId: orgId, appointmentRequested: true } }),
    prisma.voiceKnowledgeBaseItem.count({
      where: { organizationId: orgId, isActive: true },
    }),
  ]);

  const setupChecklist = [
    { label: "Business profile", complete: !!businessProfile },
    {
      label: "Receptionist settings",
      complete: !!receptionistSettings?.greetingMessage && !!receptionistSettings?.fallbackMessage,
    },
    { label: "Knowledge base", complete: knowledgeCount > 0 },
    { label: "Integrations", complete: false },
  ];

  return {
    businessProfile,
    receptionistSettings,
    stats: {
      totalLeads,
      totalCalls,
      missedCalls,
      appointmentsRequested: appointmentRequestedCalls + appointmentRequestedLeads,
      activeKnowledgeItems: knowledgeCount,
    },
    setupChecklist,
  };
}

export async function getVoiceOnboardingData(orgId: string) {
  const [businessProfile, receptionistSettings] = await Promise.all([
    prisma.voiceBusinessProfile.findUnique({ where: { organizationId: orgId } }),
    prisma.voiceReceptionistSettings.findUnique({ where: { organizationId: orgId } }),
  ]);

  return { businessProfile, receptionistSettings };
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
  const settings = await prisma.voiceIntegrationSettings.findUnique({
    where: { organizationId: orgId },
  });

  const envStatus = {
    vapi: !!process.env.VOICE_VAPI_API_KEY,
    twilio: !!process.env.VOICE_TWILIO_ACCOUNT_SID && !!process.env.VOICE_TWILIO_AUTH_TOKEN,
    googleCalendar: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    whatsapp: !!process.env.VOICE_WHATSAPP_FOLLOW_UP_WEBHOOK_URL,
  };

  return {
    settings,
    envStatus,
  };
}
