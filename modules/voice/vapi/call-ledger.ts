import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  applyVoicePrivacyToVapiPayload,
  resolveVoicePrivacyPolicy,
  serializeVoicePrivacyPolicy,
} from "@/modules/voice/privacy/service";
import {
  extractVapiCall,
  isTerminalCallStatus,
  normalizeVapiCall,
  VAPI_PROVIDER,
} from "@/modules/voice/vapi/call-lifecycle";
import { redactVapiPayload } from "@/modules/voice/vapi/event-security";
import { reconcileVoiceUsageMeterFromCallLogs } from "@/modules/voice/usage-reconciliation";

type VoiceCallMapping = {
  organizationId: string;
  voiceBusinessProfileId?: string | null;
  voiceAgentId?: string | null;
};

type LedgerUpsertOptions = {
  source?: "provider_payload" | "provider_api";
  providerSyncedAt?: Date | null;
  reconciliationStatus?: string;
  discrepancies?: string[];
  receivedAt?: Date;
  finalizeAccounting?: boolean;
};

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getProviderIds(message: any) {
  const call = extractVapiCall(message);
  return {
    assistantId:
      nonEmptyString(call.assistantId) ||
      nonEmptyString(message?.assistantId) ||
      nonEmptyString(message?.assistant?.id),
    phoneNumberId:
      nonEmptyString(call.phoneNumberId) ||
      nonEmptyString(message?.phoneNumberId) ||
      nonEmptyString(message?.phoneNumber?.id),
  };
}

function getCallerNumber(message: any, direction: string) {
  const call = extractVapiCall(message);
  const customerNumber =
    nonEmptyString(call.customer?.number) ||
    nonEmptyString(call.customer?.phoneNumber) ||
    nonEmptyString(message?.customer?.number);
  if (customerNumber) return customerNumber;

  const businessNumber =
    nonEmptyString(call.phoneNumber?.number) ||
    nonEmptyString(message?.phoneNumber?.number);
  return direction === "OUTBOUND" ? businessNumber || "Unknown" : "Unknown";
}

async function findExistingCall(externalCallKey: string, externalCallId: string) {
  return prisma.voiceCallLog.findFirst({
    where: {
      OR: [
        { externalCallKey },
        { provider: VAPI_PROVIDER, providerCallId: externalCallId },
      ],
    },
  });
}

async function releaseTrackedActiveSlot(callLogId: string, organizationId: string) {
  await prisma.$transaction(async (tx) => {
    const released = await tx.voiceCallLog.updateMany({
      where: {
        id: callLogId,
        activeSlotAcquiredAt: { not: null },
        activeSlotReleasedAt: null,
      },
      data: { activeSlotReleasedAt: new Date() },
    });

    if (released.count > 0) {
      await tx.voiceUsageMeter.updateMany({
        where: { organizationId, activeCalls: { gt: 0 } },
        data: { activeCalls: { decrement: 1 } },
      });
    }
  });
}

async function finalizeCustomerBilling(callLogId: string) {
  return prisma.$transaction(async (tx) => {
    const call = await tx.voiceCallLog.findUnique({
      where: { id: callLogId },
      select: {
        id: true,
        organizationId: true,
        walletChargedAt: true,
        billableDurationSeconds: true,
        conversationDurationSeconds: true,
        totalDurationSeconds: true,
        providerActualCostUsd: true,
        costUsd: true,
      },
    });
    if (!call || call.walletChargedAt) return null;

    const organization = await tx.organization.findUnique({
      where: { id: call.organizationId },
      select: { perMinuteRate: true, currency: true },
    });
    if (!organization) return null;

    const billableSeconds =
      call.billableDurationSeconds ??
      call.conversationDurationSeconds ??
      call.totalDurationSeconds ??
      0;
    const billableMinutes = billableSeconds > 0 ? Math.ceil(billableSeconds / 60) : 0;
    const amount = billableMinutes * Number(organization.perMinuteRate);
    const finalized = await tx.voiceCallLog.updateMany({
      where: { id: call.id, walletChargedAt: null },
      data: {
        customerBillableCost: amount,
        billingCurrency: organization.currency,
        walletChargedAt: new Date(),
      },
    });
    if (finalized.count === 0) return null;

    if (amount > 0) {
      await tx.organization.update({
        where: { id: call.organizationId },
        data: { walletBalance: { decrement: new Prisma.Decimal(amount) } },
      });
    }

    return {
      organizationId: call.organizationId,
      amount,
      providerCost: call.providerActualCostUsd ?? call.costUsd,
    };
  });
}

async function upsertProviderCostLedger(callLogId: string, organizationId: string, amount: number | null) {
  if (!amount || amount <= 0) return;
  const existing = await prisma.costLedger.findFirst({
    where: { callId: callLogId, provider: "VAPI", service: "Total" },
  });
  if (existing) {
    await prisma.costLedger.update({
      where: { id: existing.id },
      data: { amount },
    });
    return;
  }
  await prisma.costLedger.create({
    data: {
      tenantId: organizationId,
      callId: callLogId,
      provider: "VAPI",
      service: "Total",
      amount,
    },
  });
}

async function ensureMissedCallFollowUp(callLog: {
  organizationId: string;
  voiceAgentId: string | null;
  providerCallId: string | null;
  callerNumber: string;
  endedReason: string | null;
  isMissed: boolean;
}) {
  if (!callLog.isMissed || !callLog.providerCallId) return;
  const outcomeKey = `vapi:${callLog.providerCallId}:missed-follow-up`;
  await prisma.voiceLead.upsert({
    where: { outcomeKey },
    update: {},
    create: {
      organizationId: callLog.organizationId,
      voiceAgentId: callLog.voiceAgentId,
      phone: callLog.callerNumber === "Unknown" ? null : callLog.callerNumber,
      reasonForCall: "Missed inbound call",
      notes: callLog.endedReason
        ? `Callback review required. Provider ended reason: ${callLog.endedReason}`
        : "Callback review required.",
      source: "VAPI_MISSED_CALL",
      status: "NEW",
      providerCallId: callLog.providerCallId,
      outcomeKey,
    },
  });
}

export async function markVapiActiveSlotAcquired({
  mapping,
  message,
  receivedAt = new Date(),
}: {
  mapping: VoiceCallMapping;
  message: unknown;
  receivedAt?: Date;
}) {
  const callLog = await upsertVapiCallLedger(mapping, message, {
    receivedAt,
    finalizeAccounting: false,
  });
  if (!callLog) return null;

  await prisma.voiceCallLog.updateMany({
    where: { id: callLog.id, activeSlotAcquiredAt: null },
    data: { activeSlotAcquiredAt: receivedAt },
  });
  return callLog;
}

export async function upsertVapiCallLedger(
  mapping: VoiceCallMapping,
  message: unknown,
  options: LedgerUpsertOptions = {},
) {
  const receivedAt = options.receivedAt ?? new Date();
  const rawProvisional = normalizeVapiCall({
    message,
    eventReceivedAt: receivedAt,
  });
  if (!rawProvisional) return null;

  const existing = await findExistingCall(
    rawProvisional.externalCallKey,
    rawProvisional.externalCallId,
  );
  const privacyPolicy = await resolveVoicePrivacyPolicy(
    mapping.organizationId,
  );
  const privacyResult = applyVoicePrivacyToVapiPayload(
    message,
    privacyPolicy,
    {
      recordingPreviouslyAuthorized:
        existing?.recordingDisclosureStatus === "completed" ||
        existing?.recordingDisclosureStatus === "not_required",
    },
  );
  const privacySafeMessage = privacyResult.payload;
  const provisional = normalizeVapiCall({
    message: privacySafeMessage,
    eventReceivedAt: receivedAt,
  });
  if (!provisional) return null;

  const normalized = normalizeVapiCall({
    message: privacySafeMessage,
    existing: existing ?? {},
    eventReceivedAt: receivedAt,
  });
  if (!normalized) return null;

  const providerIds = getProviderIds(privacySafeMessage as any);
  const callerNumber = getCallerNumber(
    privacySafeMessage as any,
    normalized.direction,
  );
  const redactedEvent = JSON.stringify(
    redactVapiPayload(privacySafeMessage),
  );
  const disclosureStatus =
    privacyResult.disclosure.status === "pending" &&
    (existing?.recordingDisclosureStatus === "completed" ||
      existing?.recordingDisclosureStatus === "not_required")
      ? existing.recordingDisclosureStatus
      : privacyResult.disclosure.status;
  const discrepancyJson =
    options.discrepancies && options.discrepancies.length > 0
      ? JSON.stringify([...new Set(options.discrepancies)].sort())
      : existing?.reconciliationDiscrepancyJson ?? null;
  const data = {
    externalCallKey: normalized.externalCallKey,
    provider: VAPI_PROVIDER,
    providerCallId: normalized.externalCallId,
    providerPhoneNumberId: providerIds.phoneNumberId ?? existing?.providerPhoneNumberId ?? null,
    providerAssistantId: providerIds.assistantId ?? existing?.providerAssistantId ?? null,
    providerStatus: normalized.providerStatus,
    voiceBusinessProfileId:
      mapping.voiceBusinessProfileId ?? existing?.voiceBusinessProfileId ?? null,
    voiceAgentId: mapping.voiceAgentId ?? existing?.voiceAgentId ?? null,
    callerNumber: callerNumber === "Unknown" ? existing?.callerNumber ?? callerNumber : callerNumber,
    fromNumberMasked: normalized.fromNumberMasked ?? existing?.fromNumberMasked ?? null,
    toNumberMasked: normalized.toNumberMasked ?? existing?.toNumberMasked ?? null,
    callStatus: normalized.status,
    callDirection:
      normalized.direction === "UNKNOWN"
        ? existing?.callDirection ?? "UNKNOWN"
        : normalized.direction,
    callOutcome: normalized.outcome,
    endedReason: normalized.endedReason ?? existing?.endedReason ?? null,
    startedAt: normalized.startedAt ?? existing?.startedAt ?? receivedAt,
    ringingAt: normalized.ringingAt ?? existing?.ringingAt ?? null,
    answeredAt: normalized.answeredAt ?? existing?.answeredAt ?? null,
    endedAt: normalized.endedAt ?? existing?.endedAt ?? null,
    lastEventAt: receivedAt,
    durationSeconds: normalized.totalDurationSeconds,
    totalDurationSeconds: normalized.totalDurationSeconds,
    ringDurationSeconds: normalized.ringDurationSeconds,
    conversationDurationSeconds: normalized.conversationDurationSeconds,
    billableDurationSeconds: normalized.billableDurationSeconds,
    costUsd: normalized.providerActualCostUsd ?? existing?.costUsd ?? null,
    providerActualCostUsd:
      normalized.providerActualCostUsd ?? existing?.providerActualCostUsd ?? null,
    providerEstimatedCostUsd:
      normalized.providerEstimatedCostUsd ?? existing?.providerEstimatedCostUsd ?? null,
    costBreakdownJson: normalized.costBreakdown
      ? JSON.stringify(normalized.costBreakdown)
      : existing?.costBreakdownJson ?? null,
    summary: normalized.summary ?? existing?.summary ?? null,
    transcript: privacyPolicy.transcriptionEnabled
      ? normalized.transcript ?? existing?.transcript ?? null
      : null,
    recordingUrl: privacyResult.disclosure.recordingAllowed
      ? normalized.recordingUrl ?? existing?.recordingUrl ?? null
      : null,
    recordingDisclosureStatus: disclosureStatus,
    recordingDisclosureType:
      privacyResult.disclosure.type ??
      existing?.recordingDisclosureType ??
      null,
    recordingDisclosureCompletedAt:
      privacyResult.disclosure.completedAt ??
      existing?.recordingDisclosureCompletedAt ??
      null,
    recordingDeletedAt:
      !privacyResult.disclosure.recordingAllowed &&
      (rawProvisional.recordingUrl || existing?.recordingUrl)
        ? receivedAt
        : existing?.recordingDeletedAt ?? null,
    transcriptDeletedAt:
      !privacyPolicy.transcriptionEnabled &&
      (rawProvisional.transcript || existing?.transcript)
        ? receivedAt
        : existing?.transcriptDeletedAt ?? null,
    privacyPolicySnapshot: serializeVoicePrivacyPolicy(privacyPolicy),
    structuredDataJson:
      normalized.structuredData !== null && normalized.structuredData !== undefined
        ? JSON.stringify(normalized.structuredData)
        : existing?.structuredDataJson ?? null,
    successEvaluation:
      normalized.successEvaluation ?? existing?.successEvaluation ?? null,
    transcriptStatus: privacyPolicy.transcriptionEnabled
      ? normalized.transcriptStatus === "not_available" &&
        existing?.transcriptStatus === "ready"
        ? "ready"
        : normalized.transcriptStatus
      : "not_available",
    analysisStatus:
      normalized.analysisStatus === "awaiting_analysis" && existing?.analysisStatus === "ready"
        ? "ready"
        : normalized.analysisStatus,
    reconciliationStatus:
      options.reconciliationStatus ?? existing?.reconciliationStatus ?? "not_checked",
    reconciliationDiscrepancyJson: discrepancyJson,
    providerSyncedAt: options.providerSyncedAt ?? existing?.providerSyncedAt ?? null,
    usageMetricsSource: options.source ?? existing?.usageMetricsSource ?? "provider_payload",
    rawEventJson: redactedEvent,
    isAnswered: normalized.isAnswered,
    isCompleted: normalized.isCompleted,
    isMissed: normalized.isMissed,
    isFailed: normalized.isFailed,
    isAbandoned: normalized.isAbandoned,
    isVoicemail: normalized.isVoicemail,
    transferRequested: normalized.transferRequested,
    transferConnected: normalized.transferConnected,
    transferFailed: normalized.transferFailed,
    isTransferred: normalized.isTransferred,
    isQualified: normalized.isQualified,
    isResolved: normalized.isResolved,
    requiresFollowUp: normalized.requiresFollowUp,
    isTestCall: normalized.isTestCall || existing?.isTestCall || false,
  };

  let callLog;
  if (existing) {
    callLog = await prisma.voiceCallLog.update({
      where: { id: existing.id },
      data,
    });
  } else {
    try {
      callLog = await prisma.voiceCallLog.create({
        data: {
          organizationId: mapping.organizationId,
          appointmentRequested: false,
          ...data,
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
      callLog = await prisma.voiceCallLog.update({
        where: { externalCallKey: normalized.externalCallKey },
        data,
      });
    }
  }

  if (isTerminalCallStatus(callLog.callStatus)) {
    await releaseTrackedActiveSlot(callLog.id, mapping.organizationId);
    await ensureMissedCallFollowUp(callLog);
    if (options.finalizeAccounting) {
      const billing = await finalizeCustomerBilling(callLog.id);
      await upsertProviderCostLedger(
        callLog.id,
        mapping.organizationId,
        billing?.providerCost ?? callLog.providerActualCostUsd ?? callLog.costUsd,
      );
    }
    await reconcileVoiceUsageMeterFromCallLogs(mapping.organizationId);
  }

  return callLog;
}
