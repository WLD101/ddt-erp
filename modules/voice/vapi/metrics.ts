import { prisma } from "@/lib/prisma";

export type CallMetricRecord = {
  callDirection: string;
  conversationDurationSeconds: number | null;
  billableDurationSeconds: number | null;
  providerActualCostUsd: number | null;
  customerBillableCost: number | null;
  isAnswered: boolean;
  isCompleted: boolean;
  isMissed: boolean;
  isFailed: boolean;
  isTransferred: boolean;
  isVoicemail: boolean;
  isQualified: boolean;
  isResolved: boolean;
  requiresFollowUp: boolean;
};

export function summarizeVoiceCallMetrics(calls: CallMetricRecord[]) {
  const totalConversationSeconds = calls.reduce(
    (sum, call) => sum + (call.conversationDurationSeconds || 0),
    0,
  );
  const answeredCalls = calls.filter((call) => call.isAnswered).length;
  const transferredCalls = calls.filter((call) => call.isTransferred).length;

  return {
    totalCalls: calls.length,
    inboundCalls: calls.filter((call) => call.callDirection === "INBOUND").length,
    outboundCalls: calls.filter((call) => call.callDirection === "OUTBOUND").length,
    answeredCalls,
    missedCalls: calls.filter((call) => call.isMissed).length,
    failedCalls: calls.filter((call) => call.isFailed).length,
    completedCalls: calls.filter((call) => call.isCompleted).length,
    transferredCalls,
    voicemailCalls: calls.filter((call) => call.isVoicemail).length,
    qualifiedCalls: calls.filter((call) => call.isQualified).length,
    resolvedCalls: calls.filter((call) => call.isResolved).length,
    followUpCalls: calls.filter((call) => call.requiresFollowUp).length,
    totalConversationSeconds,
    averageConversationSeconds:
      answeredCalls > 0 ? Math.round(totalConversationSeconds / answeredCalls) : 0,
    billableSeconds: calls.reduce(
      (sum, call) => sum + (call.billableDurationSeconds || 0),
      0,
    ),
    providerCostUsd: Number(
      calls.reduce((sum, call) => sum + (call.providerActualCostUsd || 0), 0).toFixed(6),
    ),
    customerBillableAmount: Number(
      calls.reduce((sum, call) => sum + (call.customerBillableCost || 0), 0).toFixed(6),
    ),
    humanEscalationRate:
      calls.length > 0 ? Number((transferredCalls / calls.length).toFixed(4)) : 0,
    aiResolutionRate:
      calls.length > 0
        ? Number((calls.filter((call) => call.isResolved).length / calls.length).toFixed(4))
        : 0,
  };
}

export async function getVoiceCallMetrics({
  organizationId,
  from,
  to,
  assistantId,
  phoneNumberId,
  direction,
}: {
  organizationId: string;
  from?: Date;
  to?: Date;
  assistantId?: string;
  phoneNumberId?: string;
  direction?: string;
}) {
  const calls = await prisma.voiceCallLog.findMany({
    where: {
      organizationId,
      createdAt: from || to ? { gte: from, lt: to } : undefined,
      providerAssistantId: assistantId,
      providerPhoneNumberId: phoneNumberId,
      callDirection: direction,
      isTestCall: false,
    },
    select: {
      callDirection: true,
      conversationDurationSeconds: true,
      billableDurationSeconds: true,
      providerActualCostUsd: true,
      customerBillableCost: true,
      isAnswered: true,
      isCompleted: true,
      isMissed: true,
      isFailed: true,
      isTransferred: true,
      isVoicemail: true,
      isQualified: true,
      isResolved: true,
      requiresFollowUp: true,
    },
  });
  return summarizeVoiceCallMetrics(calls);
}
