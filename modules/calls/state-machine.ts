import { TelecomError } from "./errors";

export type CallStatus =
  | "CREATED"
  | "VALIDATING"
  | "REJECTED"
  | "ROUTING"
  | "NO_ROUTE"
  | "QUEUED"
  | "INITIATING"
  | "RINGING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BUSY"
  | "NO_ANSWER"
  | "CANCELLED"
  | "FAILED";

export const TERMINAL_CALL_STATUSES = new Set<CallStatus>([
  "REJECTED",
  "NO_ROUTE",
  "COMPLETED",
  "BUSY",
  "NO_ANSWER",
  "CANCELLED",
  "FAILED",
]);

const VALID_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
  CREATED: ["VALIDATING", "ROUTING", "REJECTED", "FAILED"],
  VALIDATING: ["ROUTING", "REJECTED", "FAILED"],
  REJECTED: [],
  ROUTING: ["NO_ROUTE", "QUEUED", "INITIATING", "FAILED"],
  NO_ROUTE: [],
  QUEUED: ["INITIATING", "RINGING", "CANCELLED", "FAILED"],
  INITIATING: ["RINGING", "IN_PROGRESS", "BUSY", "NO_ANSWER", "FAILED", "COMPLETED"],
  RINGING: ["IN_PROGRESS", "BUSY", "NO_ANSWER", "CANCELLED", "FAILED"],
  IN_PROGRESS: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: [],
  BUSY: [],
  NO_ANSWER: [],
  CANCELLED: [],
  FAILED: [],
};

export function assertValidTransition(from: string, to: CallStatus) {
  const current = normalizeCallStatus(from);
  if (current === to) return;

  if (!VALID_TRANSITIONS[current].includes(to)) {
    throw new TelecomError(
      "INVALID_STATE_TRANSITION",
      `Call status cannot transition from ${current} to ${to}.`,
      409
    );
  }
}

export function canTransition(from: string, to: CallStatus) {
  try {
    assertValidTransition(from, to);
    return true;
  } catch {
    return false;
  }
}

export function normalizeCallStatus(status?: string | null): CallStatus {
  const raw = (status || "CREATED").trim().toUpperCase().replace(/[-\s]/g, "_");
  switch (raw) {
    case "DRY_RUN":
    case "QUEUED":
    case "ACCEPTED":
      return "QUEUED";
    case "INITIATED":
    case "INITIATING":
      return "INITIATING";
    case "RINGING":
      return "RINGING";
    case "ANSWERED":
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "COMPLETED":
      return "COMPLETED";
    case "BUSY":
      return "BUSY";
    case "NO_ANSWER":
    case "NOANSWER":
      return "NO_ANSWER";
    case "CANCELED":
    case "CANCELLED":
      return "CANCELLED";
    case "FAILED":
    case "ERROR":
      return "FAILED";
    case "NO_ROUTE":
      return "NO_ROUTE";
    case "REJECTED":
      return "REJECTED";
    case "ROUTING":
      return "ROUTING";
    case "VALIDATING":
      return "VALIDATING";
    case "CREATED":
      return "CREATED";
    default:
      return "FAILED";
  }
}
