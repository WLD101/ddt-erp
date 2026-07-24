import { prisma } from "@/lib/prisma";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";

export async function getVapiHealthSnapshot(now = new Date()) {
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60_000);
  const staleCallThreshold = new Date(now.getTime() - 2 * 60 * 60_000);
  const [
    latestEvent,
    failedEvents,
    unresolvedEvents,
    awaitingAnalysis,
    staleOpenCalls,
    reconciliationBacklog,
    localOnlyCalls,
    duplicateAggregate,
    deadLetterJobs,
    mappedAssistants,
    mappedPhoneNumbers,
    missingAssistantMappings,
    missingPhoneMappings,
  ] = await Promise.all([
    prisma.voiceWebhookEvent.findFirst({
      orderBy: { receivedAt: "desc" },
      select: { receivedAt: true, eventType: true, status: true },
    }),
    prisma.voiceWebhookEvent.count({
      where: { status: "failed", receivedAt: { gte: last24Hours } },
    }),
    prisma.voiceWebhookEvent.count({
      where: { organizationId: null, status: { in: ["received", "mapping_failed", "failed"] } },
    }),
    prisma.voiceCallLog.count({ where: { analysisStatus: "awaiting_analysis" } }),
    prisma.voiceCallLog.count({
      where: {
        startedAt: { lte: staleCallThreshold },
        endedAt: null,
        callStatus: { notIn: ["FAILED", "CANCELLED", "PROVIDER_ERROR"] },
      },
    }),
    prisma.voiceCallLog.count({
      where: {
        reconciliationStatus: {
          in: ["not_checked", "field_mismatch", "awaiting_analysis", "manual_review"],
        },
      },
    }),
    prisma.voiceCallLog.count({ where: { reconciliationStatus: "whatsquery_only" } }),
    prisma.voiceWebhookEvent.aggregate({ _sum: { duplicateCount: true } }),
    prisma.voiceJob.count({ where: { deadLetteredAt: { not: null } } }),
    prisma.voiceAgent.count({ where: { isActive: true, vapiAssistantId: { not: null } } }),
    prisma.voiceAgent.count({ where: { isActive: true, vapiPhoneNumberId: { not: null } } }),
    prisma.voiceAgent.count({ where: { isActive: true, vapiAssistantId: null } }),
    prisma.voiceAgent.count({ where: { isActive: true, vapiPhoneNumberId: null } }),
  ]);

  const env = getVapiEnvStatus();
  const degraded =
    failedEvents > 0 ||
    unresolvedEvents > 0 ||
    staleOpenCalls > 0 ||
    deadLetterJobs > 0;

  return {
    status: degraded ? "DEGRADED" : "HEALTHY",
    apiCredentialConfigured: env.hasPrivateKey,
    webhookAuthenticationConfigured: env.hasWebhookSecret,
    webhookUrl: env.webhookUrl || null,
    latestEvent,
    failedEventsLast24Hours: failedEvents,
    unresolvedEvents,
    awaitingAnalysis,
    staleOpenCalls,
    reconciliationBacklog,
    localOnlyCalls,
    duplicateDeliveries: Number(duplicateAggregate._sum.duplicateCount || 0),
    deadLetterJobs,
    mappedAssistants,
    mappedPhoneNumbers,
    missingAssistantMappings,
    missingPhoneMappings,
  };
}
