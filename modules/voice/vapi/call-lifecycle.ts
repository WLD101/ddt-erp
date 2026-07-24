export const VAPI_PROVIDER = "vapi";

export const NORMALIZED_CALL_STATUSES = [
  "CREATED",
  "QUEUED",
  "RINGING",
  "ANSWERED",
  "IN_PROGRESS",
  "TRANSFERRING",
  "TRANSFERRED",
  "COMPLETED",
  "FAILED",
  "BUSY",
  "NO_ANSWER",
  "CANCELLED",
  "VOICEMAIL",
  "PROVIDER_ERROR",
  "UNKNOWN",
] as const;

export type NormalizedCallStatus = (typeof NORMALIZED_CALL_STATUSES)[number];
export type CallDirection = "INBOUND" | "OUTBOUND" | "UNKNOWN";

type ExistingLifecycle = {
  callStatus?: string | null;
  callDirection?: string | null;
  callOutcome?: string | null;
  providerStatus?: string | null;
  startedAt?: Date | null;
  ringingAt?: Date | null;
  answeredAt?: Date | null;
  endedAt?: Date | null;
  totalDurationSeconds?: number | null;
  ringDurationSeconds?: number | null;
  conversationDurationSeconds?: number | null;
  billableDurationSeconds?: number | null;
  durationSeconds?: number | null;
  isAnswered?: boolean | null;
  isCompleted?: boolean | null;
  isMissed?: boolean | null;
  isFailed?: boolean | null;
  isAbandoned?: boolean | null;
  isVoicemail?: boolean | null;
  transferRequested?: boolean | null;
  transferConnected?: boolean | null;
  transferFailed?: boolean | null;
  isTransferred?: boolean | null;
  isQualified?: boolean | null;
  isResolved?: boolean | null;
  requiresFollowUp?: boolean | null;
};

export type NormalizedVapiCall = {
  externalCallId: string;
  externalCallKey: string;
  direction: CallDirection;
  providerStatus: string | null;
  status: NormalizedCallStatus;
  outcome: string | null;
  endedReason: string | null;
  fromNumberMasked: string | null;
  toNumberMasked: string | null;
  startedAt: Date | null;
  ringingAt: Date | null;
  answeredAt: Date | null;
  endedAt: Date | null;
  totalDurationSeconds: number | null;
  ringDurationSeconds: number | null;
  conversationDurationSeconds: number | null;
  billableDurationSeconds: number | null;
  providerActualCostUsd: number | null;
  providerEstimatedCostUsd: number | null;
  costBreakdown: Record<string, unknown> | null;
  transcript: string | null;
  recordingUrl: string | null;
  summary: string | null;
  structuredData: unknown;
  successEvaluation: string | null;
  transcriptStatus: string;
  analysisStatus: string;
  isAnswered: boolean;
  isCompleted: boolean;
  isMissed: boolean;
  isFailed: boolean;
  isAbandoned: boolean;
  isVoicemail: boolean;
  transferRequested: boolean;
  transferConnected: boolean;
  transferFailed: boolean;
  isTransferred: boolean;
  isQualified: boolean;
  isResolved: boolean;
  requiresFollowUp: boolean;
  isTestCall: boolean;
};

const TERMINAL_STATUSES = new Set<NormalizedCallStatus>([
  "COMPLETED",
  "FAILED",
  "BUSY",
  "NO_ANSWER",
  "CANCELLED",
  "VOICEMAIL",
  "PROVIDER_ERROR",
]);

const ANSWERED_STATUSES = new Set(["answered", "in-progress", "in_progress", "forwarding"]);
const SUCCESSFUL_TRANSFER_STATUSES = new Set(["connected", "completed", "success", "succeeded", "transferred"]);
const FAILED_TRANSFER_STATUSES = new Set(["failed", "error", "cancelled", "canceled", "no-answer", "busy"]);

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value > 10_000_000_000 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function firstValue(source: Record<string, any>, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], source as any);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function firstDate(source: Record<string, any>, paths: string[]) {
  return parseDate(firstValue(source, paths));
}

function firstNumber(source: Record<string, any>, paths: string[]) {
  return finiteNumber(firstValue(source, paths));
}

function secondsBetween(start: Date | null, end: Date | null) {
  if (!start || !end || end.getTime() < start.getTime()) return null;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

export function makeExternalCallKey(provider: string, externalCallId: string) {
  return `${provider.trim().toLowerCase()}:${externalCallId.trim()}`;
}

export function extractVapiCall(message: unknown) {
  const source = asRecord(message);
  const call = asRecord(source.call);
  return Object.keys(call).length > 0 ? call : source;
}

export function extractVapiCallId(message: unknown) {
  const source = asRecord(message);
  return nonEmptyString(source.call?.id) || nonEmptyString(source.callId) || nonEmptyString(source.id);
}

export function maskPhoneNumber(value: unknown) {
  const phone = nonEmptyString(value);
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return `***${digits}`;
  return `${phone.startsWith("+") ? "+" : ""}${"*".repeat(Math.min(8, digits.length - 4))}${digits.slice(-4)}`;
}

export function normalizeVapiDirection(value: unknown): CallDirection {
  const normalized = nonEmptyString(value)?.toLowerCase().replace(/[\s_-]/g, "");
  if (!normalized) return "UNKNOWN";
  if (normalized.includes("inbound")) return "INBOUND";
  if (normalized.includes("outbound")) return "OUTBOUND";
  return "UNKNOWN";
}

function reasonIncludes(reason: string, terms: string[]) {
  return terms.some((term) => reason.includes(term));
}

function classifyEndedReason(endedReason: string | null) {
  const reason = endedReason?.toLowerCase() ?? "";
  return {
    busy: reasonIncludes(reason, ["busy"]),
    noAnswer: reasonIncludes(reason, [
      "no-answer",
      "no_answer",
      "not-answered",
      "did-not-answer",
      "never-connected",
      "timeout",
    ]),
    voicemail: reasonIncludes(reason, ["voicemail"]),
    cancelled: reasonIncludes(reason, ["cancelled", "canceled"]),
    rejected: reasonIncludes(reason, ["rejected", "declined"]),
    providerError: reasonIncludes(reason, [
      "error",
      "failed",
      "vapifault",
      "provider",
      "assistant-request-failed",
      "worker-not-available",
      "database-error",
    ]),
    customerEnded: reasonIncludes(reason, ["customer-ended", "customer-hangup", "caller-ended"]),
  };
}

function normalizeProviderStatus(value: unknown) {
  return nonEmptyString(value)?.toLowerCase().replace(/\s+/g, "-") ?? null;
}

function statusFromSignals({
  providerStatus,
  endedReason,
  answered,
  existingStatus,
}: {
  providerStatus: string | null;
  endedReason: string | null;
  answered: boolean;
  existingStatus?: string | null;
}): NormalizedCallStatus {
  const reason = classifyEndedReason(endedReason);

  if (providerStatus === "scheduled" || providerStatus === "created") return "CREATED";
  if (providerStatus === "queued") return "QUEUED";
  if (providerStatus === "ringing") return "RINGING";
  if (providerStatus === "answered") return "ANSWERED";
  if (providerStatus === "in-progress" || providerStatus === "in_progress") return "IN_PROGRESS";
  if (providerStatus === "forwarding" || providerStatus === "transferring") return "TRANSFERRING";
  if (providerStatus === "transferred") return "TRANSFERRED";
  if (providerStatus === "busy" || reason.busy) return "BUSY";
  if (providerStatus === "failed" || reason.providerError) return reason.providerError ? "PROVIDER_ERROR" : "FAILED";
  if (providerStatus === "no-answer" || providerStatus === "no_answer" || reason.noAnswer || reason.rejected) {
    return "NO_ANSWER";
  }
  if (providerStatus === "voicemail" || reason.voicemail) return "VOICEMAIL";
  if (providerStatus === "cancelled" || providerStatus === "canceled" || reason.cancelled) return "CANCELLED";

  if (providerStatus === "ended" || providerStatus === "completed" || endedReason) {
    if (answered) return "COMPLETED";
    if (existingStatus && TERMINAL_STATUSES.has(existingStatus as NormalizedCallStatus)) {
      return existingStatus as NormalizedCallStatus;
    }
    return "UNKNOWN";
  }

  if (existingStatus && NORMALIZED_CALL_STATUSES.includes(existingStatus as NormalizedCallStatus)) {
    return existingStatus as NormalizedCallStatus;
  }
  return "UNKNOWN";
}

function preserveTerminalStatus(existingStatus: string | null | undefined, nextStatus: NormalizedCallStatus) {
  if (!existingStatus || !TERMINAL_STATUSES.has(existingStatus as NormalizedCallStatus)) return nextStatus;
  if (!TERMINAL_STATUSES.has(nextStatus)) return existingStatus as NormalizedCallStatus;
  if (existingStatus === "PROVIDER_ERROR" && nextStatus === "FAILED") return existingStatus as NormalizedCallStatus;
  return nextStatus;
}

function extractCostBreakdown(source: Record<string, any>, call: Record<string, any>) {
  const sourceBreakdown = asRecord(source.costBreakdown);
  if (Object.keys(sourceBreakdown).length > 0) return sourceBreakdown;
  const callBreakdown = asRecord(call.costBreakdown);
  if (Object.keys(callBreakdown).length > 0) return callBreakdown;

  const costs = Array.isArray(call.costs) ? call.costs : Array.isArray(source.costs) ? source.costs : [];
  if (costs.length === 0) return null;

  return costs.reduce<Record<string, number>>((result, item) => {
    const record = asRecord(item);
    const key = nonEmptyString(record.type) || nonEmptyString(record.provider) || "other";
    const cost = finiteNumber(record.cost);
    if (cost !== null) result[key] = (result[key] ?? 0) + cost;
    return result;
  }, {});
}

function extractAnalysis(source: Record<string, any>, call: Record<string, any>) {
  const analysis = {
    ...asRecord(call.analysis),
    ...asRecord(source.analysis),
  };
  const artifact = {
    ...asRecord(call.artifact),
    ...asRecord(source.artifact),
  };

  const transcript =
    nonEmptyString(source.transcript) ||
    nonEmptyString(artifact.transcript) ||
    nonEmptyString(call.transcript);
  const summary =
    nonEmptyString(source.summary) ||
    nonEmptyString(analysis.summary) ||
    nonEmptyString(call.summary);
  const structuredData =
    source.structuredData ??
    analysis.structuredData ??
    analysis.structuredOutput ??
    artifact.structuredData ??
    call.structuredData ??
    null;
  const successEvaluationValue =
    source.successEvaluation ??
    analysis.successEvaluation ??
    analysis.successEvaluationResult ??
    call.successEvaluation ??
    null;
  const successEvaluation =
    typeof successEvaluationValue === "string"
      ? successEvaluationValue
      : successEvaluationValue === null
        ? null
        : JSON.stringify(successEvaluationValue);
  const recording =
    nonEmptyString(source.recordingUrl) ||
    nonEmptyString(artifact.recordingUrl) ||
    nonEmptyString(asRecord(artifact.recording).url) ||
    nonEmptyString(call.recordingUrl);

  return { transcript, summary, structuredData, successEvaluation, recording };
}

function extractOutcome(structuredData: unknown, existingOutcome?: string | null) {
  const structured = asRecord(structuredData);
  return nonEmptyString(structured.outcome) || nonEmptyString(structured.callOutcome) || existingOutcome || null;
}

function isTrue(value: unknown) {
  return value === true || value === "true";
}

export function isTerminalCallStatus(status: string) {
  return TERMINAL_STATUSES.has(status as NormalizedCallStatus);
}

export function normalizeVapiCall({
  message,
  existing = {},
  eventReceivedAt = new Date(),
}: {
  message: unknown;
  existing?: ExistingLifecycle;
  eventReceivedAt?: Date;
}): NormalizedVapiCall | null {
  const source = asRecord(message);
  const call = extractVapiCall(source);
  const externalCallId = extractVapiCallId(source);
  if (!externalCallId) return null;

  const eventType = nonEmptyString(source.type)?.toLowerCase() ?? null;
  const providerStatus = normalizeProviderStatus(source.status ?? call.status ?? existing.providerStatus);
  const endedReason =
    nonEmptyString(source.endedReason) ||
    nonEmptyString(call.endedReason) ||
    null;
  const analysis = extractAnalysis(source, call);
  const startedAt =
    firstDate(call, ["startedAt", "startTime", "createdAt"]) ||
    firstDate(source, ["startedAt", "startTime"]) ||
    existing.startedAt ||
    null;
  const explicitAnsweredAt =
    firstDate(call, ["answeredAt", "connectedAt"]) ||
    firstDate(source, ["answeredAt", "connectedAt"]);
  const endedClassification = classifyEndedReason(endedReason);
  const connectedTimestampEvidence =
    Boolean(startedAt) &&
    Boolean(
      firstDate(call, ["endedAt", "endTime"]) ||
      firstDate(source, ["endedAt", "endTime"]),
    ) &&
    !endedClassification.busy &&
    !endedClassification.noAnswer &&
    !endedClassification.voicemail &&
    !endedClassification.cancelled &&
    !endedClassification.rejected &&
    !endedClassification.providerError;
  const answeredSignal =
    ANSWERED_STATUSES.has(providerStatus ?? "") ||
    Boolean(existing.isAnswered) ||
    Boolean(existing.answeredAt) ||
    Boolean(explicitAnsweredAt) ||
    Boolean(analysis.transcript) ||
    (Array.isArray(call.messages) && call.messages.length > 1) ||
    connectedTimestampEvidence;
  const answeredAt =
    explicitAnsweredAt ||
    existing.answeredAt ||
    (ANSWERED_STATUSES.has(providerStatus ?? "") ? eventReceivedAt : null) ||
    (answeredSignal ? startedAt : null);
  const ringingAt =
    firstDate(call, ["ringingAt"]) ||
    firstDate(source, ["ringingAt"]) ||
    existing.ringingAt ||
    (providerStatus === "ringing" ? eventReceivedAt : null);
  const endedAt =
    firstDate(call, ["endedAt", "endTime"]) ||
    firstDate(source, ["endedAt", "endTime"]) ||
    existing.endedAt ||
    ((providerStatus === "ended" || endedReason) ? eventReceivedAt : null);

  const directTotal = firstNumber(source, [
    "totalDurationSeconds",
    "call.totalDurationSeconds",
    "durationSeconds",
    "call.durationSeconds",
    "duration",
    "call.duration",
  ]);
  const totalDurationSeconds =
    directTotal !== null
      ? Math.max(0, Math.round(directTotal))
      : secondsBetween(startedAt, endedAt) ?? existing.totalDurationSeconds ?? existing.durationSeconds ?? null;
  const directConversation = firstNumber(source, [
    "conversationDurationSeconds",
    "call.conversationDurationSeconds",
    "artifact.conversationDurationSeconds",
    "call.artifact.conversationDurationSeconds",
  ]);
  const conversationDurationSeconds =
    directConversation !== null
      ? Math.max(0, Math.round(directConversation))
      : secondsBetween(answeredAt, endedAt) ?? existing.conversationDurationSeconds ?? null;
  const ringDurationSeconds =
    firstNumber(source, ["ringDurationSeconds", "call.ringDurationSeconds"]) ??
    secondsBetween(startedAt, answeredAt) ??
    existing.ringDurationSeconds ??
    null;
  const directBillable = firstNumber(source, [
    "billableDurationSeconds",
    "call.billableDurationSeconds",
    "billableSeconds",
    "call.billableSeconds",
  ]);
  const billableDurationSeconds =
    directBillable !== null
      ? Math.max(0, Math.round(directBillable))
      : existing.billableDurationSeconds ?? conversationDurationSeconds ?? totalDurationSeconds;

  let status = statusFromSignals({
    providerStatus,
    endedReason,
    answered: answeredSignal,
    existingStatus: existing.callStatus,
  });
  status = preserveTerminalStatus(existing.callStatus, status);
  const direction =
    normalizeVapiDirection(call.type ?? source.direction ?? call.direction) !== "UNKNOWN"
      ? normalizeVapiDirection(call.type ?? source.direction ?? call.direction)
      : normalizeVapiDirection(existing.callDirection);
  const reason = classifyEndedReason(endedReason);
  const terminal = isTerminalCallStatus(status) || providerStatus === "ended" || Boolean(endedReason);
  const isAnswered = answeredSignal;
  const isCompleted = terminal && isAnswered && status === "COMPLETED";
  const isFailed =
    Boolean(existing.isFailed) ||
    status === "FAILED" ||
    status === "PROVIDER_ERROR" ||
    reason.providerError;
  const isVoicemail = Boolean(existing.isVoicemail) || status === "VOICEMAIL" || reason.voicemail;
  const isMissed =
    Boolean(existing.isMissed) ||
    (direction === "INBOUND" && terminal && !isAnswered && !isVoicemail);
  const isAbandoned =
    Boolean(existing.isAbandoned) ||
    (direction === "INBOUND" && terminal && !isAnswered && reason.customerEnded && !isFailed);

  const transfer = asRecord(source.transfer ?? source.transferResult);
  const transferStatus = normalizeProviderStatus(source.transferStatus ?? transfer.status ?? source.status);
  const transferRequested =
    Boolean(existing.transferRequested) ||
    eventType === "transfer-update" ||
    Boolean(source.destination) ||
    (Array.isArray(call.transfers) && call.transfers.length > 0);
  const transferConnected =
    Boolean(existing.transferConnected) ||
    (transferRequested && SUCCESSFUL_TRANSFER_STATUSES.has(transferStatus ?? ""));
  const transferFailed =
    Boolean(existing.transferFailed) ||
    (transferRequested && FAILED_TRANSFER_STATUSES.has(transferStatus ?? ""));
  const isTransferred = Boolean(existing.isTransferred) || transferConnected || status === "TRANSFERRED";

  const structured = asRecord(analysis.structuredData);
  const outcome = extractOutcome(analysis.structuredData, existing.callOutcome);
  const isQualified =
    Boolean(existing.isQualified) ||
    isTrue(structured.leadQualified) ||
    outcome === "lead_created" ||
    outcome === "appointment_booked";
  const isResolved =
    Boolean(existing.isResolved) ||
    isTrue(structured.resolved) ||
    outcome === "resolved";
  const requiresFollowUp =
    Boolean(existing.requiresFollowUp) ||
    isTrue(structured.requestedCallback) ||
    outcome === "follow_up_required" ||
    isMissed;

  const costBreakdown = extractCostBreakdown(source, call);
  const providerActualCostUsd =
    firstNumber(source, ["cost", "costUsd", "call.cost", "call.costUsd", "costBreakdown.total", "call.costBreakdown.total"]) ??
    null;
  const providerEstimatedCostUsd =
    firstNumber(source, ["estimatedCost", "estimatedCostUsd", "call.estimatedCost", "call.estimatedCostUsd"]) ??
    null;

  const customerNumber = call.customer?.number ?? call.customer?.phoneNumber ?? source.customer?.number;
  const businessNumber = call.phoneNumber?.number ?? source.phoneNumber?.number;
  const fromNumber = direction === "OUTBOUND" ? businessNumber : customerNumber;
  const toNumber = direction === "OUTBOUND" ? customerNumber : businessNumber;
  const metadata = asRecord(call.metadata ?? source.metadata);

  return {
    externalCallId,
    externalCallKey: makeExternalCallKey(VAPI_PROVIDER, externalCallId),
    direction,
    providerStatus,
    status,
    outcome,
    endedReason,
    fromNumberMasked: maskPhoneNumber(fromNumber),
    toNumberMasked: maskPhoneNumber(toNumber),
    startedAt,
    ringingAt,
    answeredAt,
    endedAt,
    totalDurationSeconds,
    ringDurationSeconds,
    conversationDurationSeconds,
    billableDurationSeconds,
    providerActualCostUsd,
    providerEstimatedCostUsd,
    costBreakdown,
    transcript: analysis.transcript,
    recordingUrl: analysis.recording,
    summary: analysis.summary,
    structuredData: analysis.structuredData,
    successEvaluation: analysis.successEvaluation,
    transcriptStatus: analysis.transcript ? "ready" : terminal ? "not_available" : "pending",
    analysisStatus:
      analysis.summary || analysis.structuredData || analysis.successEvaluation
        ? "ready"
        : terminal
          ? "awaiting_analysis"
          : "pending",
    isAnswered,
    isCompleted,
    isMissed,
    isFailed,
    isAbandoned,
    isVoicemail,
    transferRequested,
    transferConnected,
    transferFailed,
    isTransferred,
    isQualified,
    isResolved,
    requiresFollowUp,
    isTestCall: isTrue(call.test) || metadata.environment === "test" || metadata.isTestCall === true,
  };
}
