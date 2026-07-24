export function isFreshWebhookTimestamp(params: {
  timestamp: string | null;
  toleranceSeconds?: number;
  nowMs?: number;
}) {
  if (!params.timestamp) return false;
  const numericTimestamp = Number(params.timestamp);
  if (!Number.isFinite(numericTimestamp)) return false;

  const timestampMs = numericTimestamp > 10_000_000_000
    ? numericTimestamp
    : numericTimestamp * 1000;
  const toleranceSeconds =
    Number.isFinite(params.toleranceSeconds) &&
    (params.toleranceSeconds ?? 0) > 0
      ? params.toleranceSeconds!
      : 300;

  return Math.abs((params.nowMs ?? Date.now()) - timestampMs) <= toleranceSeconds * 1000;
}

