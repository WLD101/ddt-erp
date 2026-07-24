import { TelecomError } from "./errors";

export type UniqueWebhookMatch<T> = {
  type: "none" | "single" | "ambiguous";
  value: T | null;
  count: number;
};

export function selectUniqueWebhookMatch<T>(matches: T[]): UniqueWebhookMatch<T> {
  if (matches.length === 0) {
    return { type: "none", value: null, count: 0 };
  }
  if (matches.length === 1) {
    return { type: "single", value: matches[0], count: 1 };
  }
  return { type: "ambiguous", value: null, count: matches.length };
}

export function requireSingleWebhookMatch<T>(matches: T[], entityLabel: string) {
  const result = selectUniqueWebhookMatch(matches);
  if (result.type === "ambiguous") {
    throw new TelecomError(
      "AMBIGUOUS_WEBHOOK_MAPPING",
      `Webhook ${entityLabel} matched multiple records. Refusing unsafe fallback.`,
      409
    );
  }
  return result.value;
}
