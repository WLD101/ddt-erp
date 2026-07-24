import { prisma } from "@/lib/prisma";
import { resolveVoiceAgentForWebhook } from "@/modules/voice/agents/service";
import {
  extractVapiCall,
  makeExternalCallKey,
  normalizeVapiCall,
  VAPI_PROVIDER,
} from "@/modules/voice/vapi/call-lifecycle";
import { upsertVapiCallLedger } from "@/modules/voice/vapi/call-ledger";
import { getVapiPrivateApiKey } from "@/modules/voice/vapi/service";

export type VapiReconciliationOptions = {
  from: Date;
  to: Date;
  tenantId?: string;
  apply?: boolean;
  repair?: boolean;
  onlyMissing?: boolean;
  pageSize?: number;
  maxPages?: number;
};

export type VapiCallDiscrepancy = {
  providerCallId: string;
  organizationId?: string;
  issues: string[];
};

export type VapiReconciliationReport = {
  mode: "dry-run" | "apply";
  from: string;
  to: string;
  pagesRead: number;
  providerCalls: number;
  mappedCalls: number;
  unresolvedCalls: number;
  providerOnlyCalls: number;
  whatsqueryOnlyCalls: number;
  matchedCalls: number;
  correctedCalls: number;
  skippedCalls: number;
  completeProviderScan: boolean;
  discrepancies: VapiCallDiscrepancy[];
};

class VapiApiError extends Error {
  code = "VAPI_API_ERROR";
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseProviderDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchVapiCallsWindow({
  from,
  to,
  limit,
}: {
  from: Date;
  to: Date;
  limit: number;
}) {
  const apiKey = getVapiPrivateApiKey();
  if (!apiKey) {
    const error = new VapiApiError("Vapi private API key is not configured.");
    error.code = "VAPI_API_KEY_MISSING";
    throw error;
  }

  const url = new URL("https://api.vapi.ai/call");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("createdAtGe", from.toISOString());
  url.searchParams.set("createdAtLt", to.toISOString());
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const error = new VapiApiError(
      `Vapi Calls API returned ${response.status} ${response.statusText}.`,
    );
    error.code = response.status === 401 ? "VAPI_API_UNAUTHORIZED" : "VAPI_API_REQUEST_FAILED";
    throw error;
  }

  const body = await response.json();
  if (Array.isArray(body)) return body as Record<string, any>[];
  if (Array.isArray(body?.results)) return body.results as Record<string, any>[];
  throw new VapiApiError("Vapi Calls API returned an unexpected response shape.");
}

export function compareVapiCallWithLedger(
  providerCall: Record<string, any>,
  localCall:
    | {
        callStatus: string;
        totalDurationSeconds: number | null;
        durationSeconds: number | null;
        providerActualCostUsd: number | null;
        costUsd: number | null;
        analysisStatus: string;
      }
    | null,
) {
  if (!localCall) return ["missing_local_record"];
  const normalized = normalizeVapiCall({ message: providerCall });
  if (!normalized) return ["provider_call_id_missing"];

  const issues: string[] = [];
  if (localCall.callStatus !== normalized.status) issues.push("status_mismatch");

  const localDuration = localCall.totalDurationSeconds ?? localCall.durationSeconds;
  if (
    normalized.totalDurationSeconds !== null &&
    localDuration !== null &&
    Math.abs(normalized.totalDurationSeconds - localDuration) > 2
  ) {
    issues.push("duration_mismatch");
  }

  const localCost = localCall.providerActualCostUsd ?? localCall.costUsd;
  if (
    normalized.providerActualCostUsd !== null &&
    localCost !== null &&
    Math.abs(normalized.providerActualCostUsd - localCost) > 0.01
  ) {
    issues.push("cost_mismatch");
  }
  if (normalized.analysisStatus === "awaiting_analysis" || localCall.analysisStatus === "awaiting_analysis") {
    issues.push("analysis_missing");
  }
  return issues;
}

function getRoutingValues(providerCall: Record<string, any>) {
  const call = extractVapiCall(providerCall);
  const phoneNumber = call.phoneNumber || providerCall.phoneNumber || {};
  return {
    assistantId:
      nonEmptyString(call.assistantId) ||
      nonEmptyString(providerCall.assistantId) ||
      nonEmptyString(providerCall.assistant?.id),
    phoneNumberId:
      nonEmptyString(call.phoneNumberId) ||
      nonEmptyString(providerCall.phoneNumberId) ||
      nonEmptyString(phoneNumber.id),
    inboundNumber: nonEmptyString(phoneNumber.number),
    providerCallId: nonEmptyString(call.id) || nonEmptyString(providerCall.id),
  };
}

export async function reconcileVapiCalls(
  options: VapiReconciliationOptions,
): Promise<VapiReconciliationReport> {
  if (Number.isNaN(options.from.getTime()) || Number.isNaN(options.to.getTime())) {
    throw new Error("Reconciliation requires valid --from and --to dates.");
  }
  if (options.from >= options.to) {
    throw new Error("Reconciliation --from must be before --to.");
  }

  const pageSize = Math.min(1000, Math.max(1, options.pageSize || 500));
  const maxPages = Math.max(1, options.maxPages || 20);
  const report: VapiReconciliationReport = {
    mode: options.apply ? "apply" : "dry-run",
    from: options.from.toISOString(),
    to: options.to.toISOString(),
    pagesRead: 0,
    providerCalls: 0,
    mappedCalls: 0,
    unresolvedCalls: 0,
    providerOnlyCalls: 0,
    whatsqueryOnlyCalls: 0,
    matchedCalls: 0,
    correctedCalls: 0,
    skippedCalls: 0,
    completeProviderScan: false,
    discrepancies: [],
  };

  const providerCallsById = new Map<string, Record<string, any>>();
  let cursorTo = options.to;
  for (let page = 0; page < maxPages; page++) {
    const calls = await fetchVapiCallsWindow({
      from: options.from,
      to: cursorTo,
      limit: pageSize,
    });
    report.pagesRead++;
    for (const call of calls) {
      const providerCallId = nonEmptyString(call.id);
      if (providerCallId) providerCallsById.set(providerCallId, call);
    }

    if (calls.length < pageSize) {
      report.completeProviderScan = true;
      break;
    }
    const oldestCreatedAt = calls
      .map((call) => parseProviderDate(call.createdAt))
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => left.getTime() - right.getTime())[0];
    if (!oldestCreatedAt || oldestCreatedAt <= options.from) {
      report.completeProviderScan = true;
      break;
    }
    cursorTo = new Date(oldestCreatedAt.getTime());
  }

  report.providerCalls = providerCallsById.size;
  for (const providerCall of providerCallsById.values()) {
    const routing = getRoutingValues(providerCall);
    if (!routing.providerCallId) {
      report.skippedCalls++;
      continue;
    }

    const mapping = await resolveVoiceAgentForWebhook({
      assistantId: routing.assistantId || undefined,
      phoneNumberId: routing.phoneNumberId || undefined,
      inboundNumber: routing.inboundNumber || undefined,
      providerCallId: routing.providerCallId,
    });
    if (!mapping?.organizationId) {
      report.unresolvedCalls++;
      report.providerOnlyCalls++;
      report.discrepancies.push({
        providerCallId: routing.providerCallId,
        issues: ["tenant_unresolved", "phone_mapping_missing"],
      });
      continue;
    }
    if (options.tenantId && mapping.organizationId !== options.tenantId) {
      report.skippedCalls++;
      continue;
    }
    report.mappedCalls++;

    const externalCallKey = makeExternalCallKey(VAPI_PROVIDER, routing.providerCallId);
    const localCall = await prisma.voiceCallLog.findFirst({
      where: {
        OR: [
          { externalCallKey },
          { provider: VAPI_PROVIDER, providerCallId: routing.providerCallId },
        ],
      },
    });
    const issues = compareVapiCallWithLedger(providerCall, localCall);
    if (issues.includes("missing_local_record")) report.providerOnlyCalls++;
    if (options.onlyMissing && localCall) {
      report.skippedCalls++;
      continue;
    }

    const shouldRepair = Boolean(options.apply && (!localCall || options.repair));
    if (shouldRepair) {
      await upsertVapiCallLedger(mapping, providerCall, {
        source: "provider_api",
        providerSyncedAt: new Date(),
        reconciliationStatus:
          issues.includes("analysis_missing") ? "awaiting_analysis" : issues.length > 0 ? "corrected" : "matched",
        discrepancies: issues,
        finalizeAccounting: true,
      });
      if (issues.length > 0) report.correctedCalls++;
      else report.matchedCalls++;
    } else if (issues.length === 0) {
      report.matchedCalls++;
    }

    if (issues.length > 0) {
      report.discrepancies.push({
        providerCallId: routing.providerCallId,
        organizationId: mapping.organizationId,
        issues,
      });
      if (options.apply && localCall && !options.repair) {
        await prisma.voiceCallLog.update({
          where: { id: localCall.id },
          data: {
            reconciliationStatus: issues.includes("analysis_missing")
              ? "awaiting_analysis"
              : "field_mismatch",
            reconciliationDiscrepancyJson: JSON.stringify(issues),
            providerSyncedAt: new Date(),
          },
        });
      }
    }
  }

  if (report.completeProviderScan) {
    const localCalls = await prisma.voiceCallLog.findMany({
      where: {
        provider: VAPI_PROVIDER,
        providerCallId: { not: null },
        organizationId: options.tenantId || undefined,
        createdAt: { gte: options.from, lt: options.to },
      },
      select: { id: true, providerCallId: true, organizationId: true },
    });
    const localOnly = localCalls.filter(
      (call) => call.providerCallId && !providerCallsById.has(call.providerCallId),
    );
    report.whatsqueryOnlyCalls = localOnly.length;
    for (const call of localOnly) {
      report.discrepancies.push({
        providerCallId: call.providerCallId || call.id,
        organizationId: call.organizationId,
        issues: ["missing_provider_record"],
      });
    }
    if (options.apply && localOnly.length > 0) {
      await prisma.voiceCallLog.updateMany({
        where: { id: { in: localOnly.map((call) => call.id) } },
        data: {
          reconciliationStatus: "whatsquery_only",
          reconciliationDiscrepancyJson: JSON.stringify(["missing_provider_record"]),
          providerSyncedAt: new Date(),
        },
      });
    }
  }

  return report;
}
