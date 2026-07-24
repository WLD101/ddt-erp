import { prisma } from "@/lib/prisma";

export type VoiceUsageSummary = {
  callsToday: number;
  callsThisMonth: number;
  durationSecondsToday: number;
  durationSecondsThisMonth: number;
  minutesToday: number;
  minutesThisMonth: number;
  billableMinutesToday: number;
  billableMinutesThisMonth: number;
  costUsdToday: number;
  costUsdThisMonth: number;
  callsWithoutDurationThisMonth: number;
  callsWithoutCostThisMonth: number;
};

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toMinutes(seconds: number) {
  return Number((seconds / 60).toFixed(2));
}

function toBillableMinutes(seconds: number) {
  if (seconds <= 0) return 0;
  return Math.ceil(seconds / 60);
}

function usageCallWhere(organizationId: string, since: Date) {
  return {
    organizationId,
    createdAt: { gte: since },
    isTestCall: false,
  };
}

async function aggregateWindow(organizationId: string, since: Date) {
  const calls = await prisma.voiceCallLog.findMany({
    where: usageCallWhere(organizationId, since),
    select: {
      totalDurationSeconds: true,
      conversationDurationSeconds: true,
      billableDurationSeconds: true,
      durationSeconds: true,
      providerActualCostUsd: true,
      costUsd: true,
    },
  });

  const durationSeconds = calls.reduce(
    (total, call) =>
      total +
      (call.conversationDurationSeconds ??
        call.totalDurationSeconds ??
        call.durationSeconds ??
        0),
    0,
  );
  const costUsd = calls.reduce(
    (total, call) => total + (call.providerActualCostUsd ?? call.costUsd ?? 0),
    0,
  );
  const billableMinutes = calls.reduce(
    (total, call) =>
      total +
      toBillableMinutes(
        call.billableDurationSeconds ??
          call.conversationDurationSeconds ??
          call.totalDurationSeconds ??
          call.durationSeconds ??
          0,
      ),
    0,
  );

  return {
    callCount: calls.length,
    durationSeconds,
    minutes: toMinutes(durationSeconds),
    billableMinutes,
    costUsd,
  };
}

async function countMissingUsageFields(organizationId: string, since: Date) {
  const calls = await prisma.voiceCallLog.findMany({
    where: usageCallWhere(organizationId, since),
    select: {
      totalDurationSeconds: true,
      durationSeconds: true,
      providerActualCostUsd: true,
      costUsd: true,
    },
  });
  return {
    missingDuration: calls.filter(
      (call) =>
        (call.totalDurationSeconds ?? call.durationSeconds ?? 0) <= 0,
    ).length,
    missingCost: calls.filter(
      (call) =>
        (call.providerActualCostUsd ?? call.costUsd ?? 0) <= 0,
    ).length,
  };
}

export async function getVoiceUsageSummaryFromCallLogs(organizationId: string, now = new Date()): Promise<VoiceUsageSummary> {
  const dayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  const [today, month, missingFields] = await Promise.all([
    aggregateWindow(organizationId, dayStart),
    aggregateWindow(organizationId, monthStart),
    countMissingUsageFields(organizationId, monthStart),
  ]);

  return {
    callsToday: today.callCount,
    callsThisMonth: month.callCount,
    durationSecondsToday: today.durationSeconds,
    durationSecondsThisMonth: month.durationSeconds,
    minutesToday: today.minutes,
    minutesThisMonth: month.minutes,
    billableMinutesToday: today.billableMinutes,
    billableMinutesThisMonth: month.billableMinutes,
    costUsdToday: today.costUsd,
    costUsdThisMonth: month.costUsd,
    callsWithoutDurationThisMonth: missingFields.missingDuration,
    callsWithoutCostThisMonth: missingFields.missingCost,
  };
}

export async function reconcileVoiceUsageMeterFromCallLogs(organizationId: string, now = new Date()) {
  const summary = await getVoiceUsageSummaryFromCallLogs(organizationId, now);

  return prisma.voiceUsageMeter.upsert({
    where: { organizationId },
    update: {
      callsToday: summary.callsToday,
      callsThisMonth: summary.callsThisMonth,
      callMinutesToday: summary.billableMinutesToday,
      callMinutesThisMonth: summary.billableMinutesThisMonth,
      callCostUsdToday: summary.costUsdToday,
      callCostUsdThisMonth: summary.costUsdThisMonth,
      resetPeriod: startOfMonth(now),
    },
    create: {
      organizationId,
      callsToday: summary.callsToday,
      callsThisMonth: summary.callsThisMonth,
      callMinutesToday: summary.billableMinutesToday,
      callMinutesThisMonth: summary.billableMinutesThisMonth,
      callCostUsdToday: summary.costUsdToday,
      callCostUsdThisMonth: summary.costUsdThisMonth,
      resetPeriod: startOfMonth(now),
    },
  });
}
