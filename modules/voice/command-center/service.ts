import { prisma } from "@/lib/prisma";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";

export async function getVoiceCommandCenterOverview(organizationId: string) {
  const profile = await prisma.voiceBusinessProfile.findUnique({ where: { organizationId } });
  const settings = await prisma.voiceReceptionistSettings.findUnique({ where: { organizationId } });
  const integration = await prisma.voiceIntegrationSettings.findUnique({ where: { organizationId } });
  
  const vapiStatus = getVapiEnvStatus();

  const [
    totalCalls,
    missedCalls,
    totalLeads,
    unresolvedLeads,
    totalFaqs,
    activeFaqs
  ] = await Promise.all([
    prisma.voiceCallLog.count({ where: { organizationId } }),
    prisma.voiceCallLog.count({ where: { organizationId, isMissed: true } }),
    prisma.voiceLead.count({ where: { organizationId } }),
    prisma.voiceLead.count({ where: { organizationId, status: { not: "RESOLVED" } } }),
    prisma.voiceKnowledgeBaseItem.count({ where: { organizationId } }),
    prisma.voiceKnowledgeBaseItem.count({ where: { organizationId, isActive: true } })
  ]);

  return {
    system: {
      appStatus: "HEALTHY",
      dbStatus: "CONNECTED",
      vapiStatus,
    },
    setup: {
      hasProfile: !!profile,
      hasSettings: !!settings,
      hasGreeting: !!settings?.greetingMessage,
      hasBusinessHours: !!settings?.businessHours || !!profile?.openingHours,
      hasFallbackContact: !!profile?.fallbackContactMethod,
      hasFaqs: activeFaqs > 0,
    },
    assistant: {
      name: settings?.receptionistName || "WhatsQuery Receptionist",
      languageMode: settings?.languageMode || "AUTO_DETECT",
      greetingMessage: settings?.greetingMessage || "Not configured",
      fallbackMessage: settings?.fallbackMessage || "Not configured",
      afterHoursBehavior: settings?.afterHoursBehavior || "TAKE_MESSAGE",
    },
    operations: {
      calls: { total: totalCalls, missed: missedCalls },
      leads: { total: totalLeads, unresolved: unresolvedLeads },
      faqs: { total: totalFaqs, active: activeFaqs }
    }
  };
}
