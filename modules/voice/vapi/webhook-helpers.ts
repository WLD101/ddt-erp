import { prisma } from "@/lib/prisma";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";
import { upsertVapiCallLedger } from "@/modules/voice/vapi/call-ledger";

export function getCallerNumber(message: any) {
  return (
    message.call?.customer?.number ||
    message.call?.customer?.phoneNumber ||
    null
  );
}

export function normalizeCallStatus(status?: string) {
  const normalized = status?.trim().toLowerCase();

  switch (normalized) {
    case "ended":
    case "completed":
      return "COMPLETED";
    case "missed":
      return "MISSED";
    case "voicemail":
      return "VOICEMAIL";
    case "abandoned":
      return "ABANDONED";
    default:
      return normalized ? normalized.toUpperCase() : "IN_PROGRESS";
  }
}

export function isMissedStatus(status?: string, endedReason?: string | null) {
  const normalizedStatus = normalizeCallStatus(status);
  const normalizedReason = endedReason?.toLowerCase() ?? "";

  return normalizedStatus === "MISSED" || normalizedReason.includes("missed");
}

export async function touchIntegrationWebhook(
  organizationId: string,
  type: string,
  assistantId?: string | null,
) {
  const existing = await prisma.voiceIntegrationSettings.findUnique({
    where: { organizationId }
  });

  if (existing) {
    await prisma.voiceIntegrationSettings.update({
      where: { organizationId },
      data: {
        vapiStatus: "CONFIGURED",
        vapiWebhookUrl: getVapiEnvStatus().webhookUrl || undefined,
        lastWebhookAt: new Date(),
        lastWebhookType: type,
        ...(assistantId && !existing.vapiAssistantId ? { vapiAssistantId: assistantId } : {})
      },
    });
  } else {
    await prisma.voiceIntegrationSettings.create({
      data: {
        organizationId,
        vapiStatus: "CONFIGURED",
        twilioStatus: "NOT_CONNECTED",
        googleCalendarStatus: "NOT_CONNECTED",
        whatsappFollowUpStatus: "NOT_CONNECTED",
        vapiWebhookUrl: getVapiEnvStatus().webhookUrl || null,
        lastWebhookAt: new Date(),
        lastWebhookType: type,
        vapiAssistantId: assistantId || null,
      },
    });
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readPath(source: any, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, part) => acc?.[part], source);
    if (typeof value !== "undefined" && value !== null && value !== "") return value;
  }
  return null;
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value > 10_000_000_000 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function extractStartedAt(message: any) {
  return parseDateValue(
    readPath(message, [
      "startedAt",
      "startTime",
      "call.startedAt",
      "call.startedAtTimestamp",
      "call.startedAtTime",
      "call.createdAt",
    ]),
  );
}

function extractEndedAt(message: any) {
  return parseDateValue(
    readPath(message, [
      "endedAt",
      "endTime",
      "call.endedAt",
      "call.endedAtTimestamp",
      "call.endedAtTime",
      "call.updatedAt",
    ]),
  );
}

function extractDurationSeconds(message: any, existingDuration?: number | null) {
  const directDuration =
    toNumberOrNull(message?.durationSeconds) ??
    toNumberOrNull(message?.duration) ??
    toNumberOrNull(message?.call?.durationSeconds) ??
    toNumberOrNull(message?.call?.duration) ??
    toNumberOrNull(message?.analysis?.durationSeconds) ??
    toNumberOrNull(message?.analysis?.duration);

  if (directDuration !== null) {
    return Math.max(0, Math.round(directDuration));
  }

  const startedAt = extractStartedAt(message);
  const endedAt = extractEndedAt(message);
  if (startedAt && endedAt && endedAt.getTime() >= startedAt.getTime()) {
    return Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
  }

  return existingDuration ?? null;
}

function getPhoneCountryCode(phone: string | null) {
  if (!phone?.startsWith("+")) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  const knownCodes = ["971", "966", "974", "973", "965", "968", "92", "91", "44", "1"];
  return knownCodes.find((code) => digits.startsWith(`+${code}`)) || null;
}

function countryFromPhoneCode(code: string | null) {
  const countries: Record<string, string> = {
    "1": "United States / Canada",
    "44": "United Kingdom",
    "91": "India",
    "92": "Pakistan",
    "965": "Kuwait",
    "966": "Saudi Arabia",
    "968": "Oman",
    "971": "United Arab Emirates",
    "973": "Bahrain",
    "974": "Qatar",
  };
  return code ? countries[code] || null : null;
}

function extractCallerDemographics(message: any, callerNumber: string) {
  const customer = message?.call?.customer || message?.customer || {};
  const location = customer.location || message?.call?.customerLocation || message?.customerLocation || {};
  const numberCountryCode =
    normalizeString(readPath(message, ["call.customer.countryCode", "customer.countryCode"])) ||
    getPhoneCountryCode(callerNumber);

  const callerCountry =
    normalizeString(readPath(message, ["call.customer.country", "customer.country", "call.customer.location.country", "customer.location.country"])) ||
    countryFromPhoneCode(numberCountryCode);

  return {
    callerCountry,
    callerRegion:
      normalizeString(location.region) ||
      normalizeString(location.state) ||
      normalizeString(readPath(message, ["call.customer.region", "customer.region"])),
    callerCity:
      normalizeString(location.city) ||
      normalizeString(readPath(message, ["call.customer.city", "customer.city"])),
    callerTimezone:
      normalizeString(location.timezone) ||
      normalizeString(readPath(message, ["call.customer.timezone", "customer.timezone"])),
    callerNumberCountryCode: numberCountryCode,
  };
}

function extractCostPayload(message: any) {
  const possibleCost =
    toNumberOrNull(message?.costUsd) ??
    toNumberOrNull(message?.cost) ??
    toNumberOrNull(message?.call?.cost) ??
    toNumberOrNull(message?.analysis?.cost) ??
    toNumberOrNull(message?.costBreakdown?.total) ??
    toNumberOrNull(message?.costBreakdown?.totalUsd) ??
    toNumberOrNull(message?.costs?.total) ??
    null;

  const costBreakdown =
    message?.costBreakdown ??
    message?.costs ??
    message?.analysis?.costBreakdown ??
    null;

  return {
    costUsd: possibleCost,
    costBreakdownJson: costBreakdown ? JSON.stringify(costBreakdown) : null,
  };
}

export async function upsertCallLog({
  organizationId,
  voiceBusinessProfileId,
  voiceAgentId,
  message,
  callStatus,
}: {
  organizationId: string;
  voiceBusinessProfileId?: string | null;
  voiceAgentId?: string | null;
  message: any;
  callStatus: string;
}) {
  const terminal = ["COMPLETED", "MISSED", "VOICEMAIL", "ABANDONED", "FAILED"].includes(
    callStatus,
  );
  return upsertVapiCallLedger(
    {
      organizationId,
      voiceBusinessProfileId,
      voiceAgentId,
    },
    {
      ...message,
      status: message.status || callStatus.toLowerCase().replaceAll("_", "-"),
    },
    {
      source: "provider_payload",
      finalizeAccounting: terminal,
    },
  );
}
