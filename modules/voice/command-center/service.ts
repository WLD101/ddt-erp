import { prisma } from "@/lib/prisma";
import { listVoiceAgents } from "@/modules/voice/agents/service";
import { getVoiceRequestQueues } from "@/modules/voice/service";
import { getVoiceTrainingWorkspace } from "@/modules/voice/training/service";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";

export async function getVoiceCommandCenterOverview(organizationId: string) {
  const vapiStatus = getVapiEnvStatus();

  const [profile, settings, integration, voiceAgents, trainingWorkspace, queues, totalCalls, missedCalls, totalLeads, unresolvedLeads, totalFaqs, activeFaqs] =
    await Promise.all([
      prisma.voiceBusinessProfile.findUnique({ where: { organizationId } }),
      prisma.voiceReceptionistSettings.findUnique({ where: { organizationId } }),
      prisma.voiceIntegrationSettings.findUnique({ where: { organizationId } }),
      listVoiceAgents(organizationId),
      getVoiceTrainingWorkspace(organizationId),
      getVoiceRequestQueues(organizationId),
      prisma.voiceCallLog.count({ where: { organizationId } }),
      prisma.voiceCallLog.count({ where: { organizationId, isMissed: true } }),
      prisma.voiceLead.count({ where: { organizationId } }),
      prisma.voiceLead.count({ where: { organizationId, status: { not: "RESOLVED" } } }),
      prisma.voiceKnowledgeBaseItem.count({ where: { organizationId } }),
      prisma.voiceKnowledgeBaseItem.count({ where: { organizationId, isActive: true } }),
    ]);

  const completedTrainingSteps = trainingWorkspace.setupChecklist.filter((item) => item.complete).length;
  const trainingCompletion =
    trainingWorkspace.setupChecklist.length === 0
      ? 0
      : Math.round((completedTrainingSteps / trainingWorkspace.setupChecklist.length) * 100);
  const defaultAgent = voiceAgents.find((agent) => agent.isDefault) || voiceAgents[0] || null;

  return {
    system: {
      appStatus: "HEALTHY",
      dbStatus: "CONNECTED",
      vapiStatus,
      lastWebhookAt: integration?.lastWebhookAt ?? null,
      lastWebhookType: integration?.lastWebhookType ?? null,
    },
    setup: {
      hasProfile: !!profile,
      hasSettings: !!settings,
      hasGreeting: !!settings?.greetingMessage,
      hasBusinessHours: !!settings?.businessHours || !!profile?.openingHours,
      hasFallbackContact: !!profile?.fallbackContactMethod,
      hasFaqs: activeFaqs > 0,
      hasTenantMapping: !!defaultAgent?.vapiAssistantId || !!defaultAgent?.vapiPhoneNumberId,
      hasServices: trainingWorkspace.serviceItems.length > 0,
      hasPromptSync: !!trainingWorkspace.runtime.vapiMapping.lastPromptSyncedAt,
      trainingCompletion,
    },
    assistant: {
      name: settings?.receptionistName || "WhatsQuery Receptionist",
      languageMode: settings?.languageMode || "AUTO_DETECT",
      greetingMessage: settings?.greetingMessage || "Not configured",
      fallbackMessage: settings?.fallbackMessage || "Not configured",
      afterHoursBehavior: settings?.afterHoursBehavior || "TAKE_MESSAGE",
      providerAssistantId: defaultAgent?.vapiAssistantId || null,
      providerPhoneNumberId: defaultAgent?.vapiPhoneNumberId || null,
      voiceAgentName: defaultAgent?.name || "Not mapped yet",
    },
    operations: {
      calls: { total: totalCalls, missed: missedCalls },
      leads: { total: totalLeads, unresolved: unresolvedLeads },
      faqs: { total: totalFaqs, active: activeFaqs },
      reservations: queues.reservations.length,
      orders: queues.orders.length,
      callbacks: queues.callbacks.length,
    },
    training: {
      checklist: trainingWorkspace.setupChecklist,
      servicesCount: trainingWorkspace.serviceItems.length,
      activeFaqs,
      lastPromptSyncedAt: trainingWorkspace.runtime.vapiMapping.lastPromptSyncedAt,
      promptPreview: trainingWorkspace.promptPreview,
      assistantMapped: !!trainingWorkspace.voiceAgent?.vapiAssistantId,
      phoneMapped: !!trainingWorkspace.voiceAgent?.vapiPhoneNumberId,
      toolSummary: trainingWorkspace.toolConfigurationSummary,
    },
  };
}
