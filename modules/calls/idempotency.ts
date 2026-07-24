import crypto from "crypto";

export function createRequestFingerprint(input: unknown) {
  return crypto.createHash("sha256").update(stableStringify(input)).digest("hex");
}

export function createDeterministicEventId(provider: string, payload: Record<string, unknown>) {
  const stableFields = {
    provider,
    callId: payload.CallSid || payload.Sid || payload.callId || payload.channelId || null,
    status: payload.CallStatus || payload.status || payload.callStatus || null,
    timestamp: payload.Timestamp || payload.timestamp || payload.eventTime || payload.createdAt || null,
    sequence: payload.SequenceNumber || payload.sequence || payload.eventId || payload.id || null,
  };

  return crypto.createHash("sha256").update(stableStringify(stableFields)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
