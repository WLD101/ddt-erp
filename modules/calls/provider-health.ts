import { prisma } from "@/lib/prisma";
import type { CallFailureClass } from "./failure";

export type ProviderHealthStatus = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "MAINTENANCE" | "DISABLED";

export type ProviderHealthEvaluation = {
  status: ProviderHealthStatus;
  message: string;
  concurrentActiveCalls: number;
  recentSuccessRate: number | null;
  recentTemporaryFailures: number;
  recentPermanentFailures: number;
  webhookDelayMs: number | null;
  averageSetupTimeMs: number | null;
};

type ProviderHealthRecord = {
  id: string;
  type: string;
  status: string;
  manualHealthStatus?: string | null;
  healthStatus?: string | null;
  providerAvailability?: string | null;
};

const ACTIVE_STATUSES = ["QUEUED", "INITIATING", "RINGING", "IN_PROGRESS"];
const SUCCESS_STATUSES = ["COMPLETED"];
const FAILURE_STATUSES = ["FAILED", "BUSY", "NO_ANSWER", "CANCELLED"];

export async function evaluateProviderHealth(
  provider: ProviderHealthRecord,
  options: { windowMinutes?: number; maxActiveCalls?: number } = {}
): Promise<ProviderHealthEvaluation> {
  const windowMinutes = options.windowMinutes ?? Number(process.env.VOICE_PROVIDER_HEALTH_WINDOW_MINUTES || 60);
  const since = new Date(Date.now() - windowMinutes * 60_000);

  if (provider.status === "DISABLED") {
    return emptyEvaluation("DISABLED", "Provider is disabled.");
  }

  if (provider.manualHealthStatus === "MAINTENANCE") {
    return emptyEvaluation("MAINTENANCE", "Provider is in manual maintenance mode.");
  }

  const [activeCalls, attempts, events] = await Promise.all([
    prisma.callAttempt.count({
      where: {
        providerId: provider.id,
        status: { in: ACTIVE_STATUSES },
      },
    }),
    prisma.callAttempt.findMany({
      where: {
        providerId: provider.id,
        createdAt: { gte: since },
      },
      select: {
        status: true,
        failureClass: true,
        createdAt: true,
        startedAt: true,
      },
      take: 500,
      orderBy: { createdAt: "desc" },
    }),
    prisma.callEvent.findMany({
      where: {
        callAttempt: { providerId: provider.id },
        receivedAt: { gte: since },
        occurredAt: { not: null },
      },
      select: { receivedAt: true, occurredAt: true },
      take: 200,
      orderBy: { receivedAt: "desc" },
    }),
  ]);

  const completed = attempts.filter((attempt) => SUCCESS_STATUSES.includes(attempt.status)).length;
  const failed = attempts.filter((attempt) => FAILURE_STATUSES.includes(attempt.status)).length;
  const denominator = completed + failed;
  const recentSuccessRate = denominator === 0 ? null : Math.round((completed / denominator) * 10000) / 100;
  const recentTemporaryFailures = attempts.filter((attempt) => attempt.failureClass === "TEMPORARY_PROVIDER_FAILURE").length;
  const recentPermanentFailures = attempts.filter((attempt) => attempt.failureClass === "PERMANENT_DESTINATION_FAILURE").length;
  const maxActiveCalls = options.maxActiveCalls ?? Number(process.env.VOICE_PROVIDER_MAX_ACTIVE_CALLS || 100);
  const webhookDelayMs = average(
    events
      .map((event) => event.occurredAt ? event.receivedAt.getTime() - event.occurredAt.getTime() : null)
      .filter((value): value is number => value !== null && value >= 0)
  );
  const averageSetupTimeMs = average(
    attempts
      .map((attempt) => attempt.startedAt ? attempt.startedAt.getTime() - attempt.createdAt.getTime() : null)
      .filter((value): value is number => value !== null && value >= 0)
  );

  let status: ProviderHealthStatus = "HEALTHY";
  let message = "Provider is within configured thresholds.";

  if (activeCalls >= maxActiveCalls) {
    status = "DEGRADED";
    message = "Provider active-call capacity is near or above the configured limit.";
  }
  if (recentTemporaryFailures >= Number(process.env.VOICE_PROVIDER_TEMP_FAILURE_UNHEALTHY || 10)) {
    status = "UNHEALTHY";
    message = "Provider has too many recent temporary failures.";
  } else if (recentTemporaryFailures >= Number(process.env.VOICE_PROVIDER_TEMP_FAILURE_DEGRADED || 3)) {
    status = "DEGRADED";
    message = "Provider has elevated recent temporary failures.";
  }
  if (recentSuccessRate !== null && recentSuccessRate < Number(process.env.VOICE_PROVIDER_SUCCESS_RATE_UNHEALTHY || 50)) {
    status = "UNHEALTHY";
    message = "Provider success rate is below the unhealthy threshold.";
  } else if (recentSuccessRate !== null && recentSuccessRate < Number(process.env.VOICE_PROVIDER_SUCCESS_RATE_DEGRADED || 80) && status === "HEALTHY") {
    status = "DEGRADED";
    message = "Provider success rate is below the degraded threshold.";
  }

  return {
    status,
    message,
    concurrentActiveCalls: activeCalls,
    recentSuccessRate,
    recentTemporaryFailures,
    recentPermanentFailures,
    webhookDelayMs,
    averageSetupTimeMs,
  };
}

export async function runProviderHealthCheck(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      manualHealthStatus: true,
      healthStatus: true,
      providerAvailability: true,
    },
  });
  if (!provider) throw new Error("Provider not found.");

  const startedAt = Date.now();
  const evaluation = await evaluateProviderHealth(provider);
  const responseTimeMs = Date.now() - startedAt;
  const safeDetails = await providerSafeCheck(provider.type);

  const updatedStatus = safeDetails.status === "UNHEALTHY" ? "UNHEALTHY" : evaluation.status;
  const message = safeDetails.message || evaluation.message;

  const check = await prisma.providerHealthCheck.create({
    data: {
      providerId: provider.id,
      status: updatedStatus,
      responseTimeMs,
      providerAvailability: safeDetails.availability,
      temporaryFailureCount: evaluation.recentTemporaryFailures,
      permanentFailureCount: evaluation.recentPermanentFailures,
      recentSuccessRate: evaluation.recentSuccessRate,
      averageSetupTimeMs: evaluation.averageSetupTimeMs,
      webhookDelayMs: evaluation.webhookDelayMs,
      concurrentActiveCalls: evaluation.concurrentActiveCalls,
      message,
      safeDetailsJson: JSON.stringify(safeDetails.details || {}),
    },
  });

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      healthStatus: updatedStatus,
      lastHealthCheckAt: check.checkedAt,
      recentSuccessRate: evaluation.recentSuccessRate,
      temporaryFailures: evaluation.recentTemporaryFailures,
      permanentFailures: evaluation.recentPermanentFailures,
      averageSetupTimeMs: evaluation.averageSetupTimeMs,
      webhookDelayMs: evaluation.webhookDelayMs,
      concurrentActiveCalls: evaluation.concurrentActiveCalls,
      providerAvailability: safeDetails.availability,
      healthMessage: message,
    },
  });

  return { provider, check, evaluation: { ...evaluation, status: updatedStatus as ProviderHealthStatus, message } };
}

export async function recordProviderOutcome(providerId: string, outcome: { status: string; failureClass?: CallFailureClass | string | null }) {
  const isSuccess = outcome.status === "COMPLETED" || outcome.status === "QUEUED" || outcome.status === "INITIATING" || outcome.status === "IN_PROGRESS";
  const isTemporary = outcome.failureClass === "TEMPORARY_PROVIDER_FAILURE";
  const isPermanent = outcome.failureClass === "PERMANENT_DESTINATION_FAILURE";

  await prisma.provider.update({
    where: { id: providerId },
    data: {
      lastSuccessfulCallAt: isSuccess ? new Date() : undefined,
      lastFailedCallAt: !isSuccess ? new Date() : undefined,
      temporaryFailures: isTemporary ? { increment: 1 } : undefined,
      permanentFailures: isPermanent ? { increment: 1 } : undefined,
    },
  });
}

export async function setProviderMaintenance(providerId: string, enabled: boolean, message?: string | null) {
  return prisma.provider.update({
    where: { id: providerId },
    data: {
      manualHealthStatus: enabled ? "MAINTENANCE" : null,
      healthStatus: enabled ? "MAINTENANCE" : "HEALTHY",
      healthMessage: message || (enabled ? "Provider placed in manual maintenance." : "Provider re-enabled."),
    },
  });
}

export function isProviderHealthAcceptable(status?: string | null, emergencyOverride = false) {
  if (emergencyOverride) return true;
  return status === "HEALTHY" || status === "DEGRADED";
}

async function providerSafeCheck(type: string) {
  if (type === "twilio") {
    const configured = Boolean(process.env.VOICE_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID);
    return {
      status: configured ? "HEALTHY" : "DEGRADED",
      availability: configured ? "credentials_present" : "credentials_missing_or_disabled",
      message: configured ? "Twilio credentials are present. No real call was placed." : "Twilio credentials are not configured.",
      details: { callingEnabled: process.env.VOICE_TWILIO_CALLING_ENABLED === "true" },
    };
  }

  if (type === "local_sip") {
    const statusUrl = process.env.ASTERISK_STATUS_URL;
    if (!statusUrl) {
      return {
        status: "DEGRADED",
        availability: "heartbeat_not_configured",
        message: "Asterisk heartbeat URL is not configured. No real call was placed.",
        details: { callingEnabled: process.env.VOICE_ASTERISK_CALLING_ENABLED === "true" },
      };
    }
    return {
      status: "HEALTHY",
      availability: "heartbeat_configured",
      message: "Asterisk heartbeat endpoint is configured. No real call was placed.",
      details: { callingEnabled: process.env.VOICE_ASTERISK_CALLING_ENABLED === "true" },
    };
  }

  return { status: "DEGRADED", availability: "unknown_provider_type", message: "Provider type has no health adapter yet." };
}

function emptyEvaluation(status: ProviderHealthStatus, message: string): ProviderHealthEvaluation {
  return {
    status,
    message,
    concurrentActiveCalls: 0,
    recentSuccessRate: null,
    recentTemporaryFailures: 0,
    recentPermanentFailures: 0,
    webhookDelayMs: null,
    averageSetupTimeMs: null,
  };
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
