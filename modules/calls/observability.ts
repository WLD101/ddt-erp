type TelecomLogFields = {
  requestId?: string | null;
  correlationId?: string | null;
  callId?: string | null;
  attemptId?: string | null;
  tenantId?: string | null;
  providerId?: string | null;
  providerCallId?: string | null;
  durationMs?: number | null;
  [key: string]: unknown;
};

export function logTelecomEvent(event: string, fields: TelecomLogFields = {}) {
  const safeFields = Object.fromEntries(
    Object.entries(fields).filter(([key]) => !/secret|token|password|authorization|signature/i.test(key))
  );
  console.log(JSON.stringify({ scope: "telecom", event, ...safeFields }));
}

export function createCorrelationId(prefix = "tel") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
