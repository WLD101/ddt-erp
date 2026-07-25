const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  do: 2,
  two: 2,
  teen: 3,
  three: 3,
  char: 4,
  four: 4,
};

export type PakistanVoiceFixtureNormalization = {
  intent: "order_confirmation" | "order_capture" | "payment_intent" | "booking_request" | "address_capture" | "unknown";
  quantities: Array<{ item: string; quantity: number }>;
  requestedDate: string | null;
  requestedTime24h: string | null;
  address: string | null;
  paymentMethod: "jazzcash" | "easypaisa" | "cash" | "online" | null;
  paymentConfirmed: boolean;
  customerConfirmed: boolean;
  normalizedText: string;
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function detectQuantity(token: string) {
  if (/^\d+$/.test(token)) return Number(token);
  return NUMBER_WORDS[token] ?? null;
}

function detectRequestedDate(text: string, referenceDate: Date) {
  if (!text.includes("kal")) return null;
  const nextDay = new Date(referenceDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return nextDay.toISOString().slice(0, 10);
}

function detectRequestedTime(text: string) {
  const match = text.match(/(\d{1,2})\s*baje/);
  if (!match) return null;
  let hour = Number(match[1]);
  if (text.includes("shaam") && hour < 12) {
    hour += 12;
  }
  return `${String(hour).padStart(2, "0")}:00`;
}

export function normalizePakistanVoiceFixtureUtterance(input: {
  utterance: string;
  referenceDate: Date;
}): PakistanVoiceFixtureNormalization {
  const normalizedText = normalizeText(input.utterance);
  const quantities: Array<{ item: string; quantity: number }> = [];

  const burgerMatch = normalizedText.match(/(do|two|one|1|2|3|teen|three)\s+zinger burgers?/);
  if (burgerMatch) {
    quantities.push({ item: "zinger burger", quantity: detectQuantity(burgerMatch[1]) ?? 1 });
  }

  const friesMatch = normalizedText.match(/(one|1|do|two|2)?\s*large fries/);
  if (friesMatch) {
    quantities.push({ item: "large fries", quantity: detectQuantity(friesMatch[1] || "one") ?? 1 });
  }

  const addressMatch = normalizedText.match(/address\s+(.+?)(?:\s+hai)?$/);
  const paymentMethod = normalizedText.includes("jazzcash")
    ? "jazzcash"
    : normalizedText.includes("easypaisa")
      ? "easypaisa"
      : normalizedText.includes("cash")
        ? "cash"
        : normalizedText.includes("online")
          ? "online"
          : null;

  const customerConfirmed = normalizedText.includes("confirm");
  const paymentConfirmed = normalizedText.includes("paid already") || normalizedText.includes("payment done");

  let intent: PakistanVoiceFixtureNormalization["intent"] = "unknown";
  if (normalizedText.includes("booking")) {
    intent = "booking_request";
  } else if (normalizedText.includes("address")) {
    intent = "address_capture";
  } else if (paymentMethod) {
    intent = "payment_intent";
  } else if (normalizedText.includes("order confirm")) {
    intent = "order_confirmation";
  } else if (quantities.length > 0) {
    intent = "order_capture";
  }

  return {
    intent,
    quantities,
    requestedDate: detectRequestedDate(normalizedText, input.referenceDate),
    requestedTime24h: detectRequestedTime(normalizedText),
    address: addressMatch?.[1]?.trim() ?? null,
    paymentMethod,
    paymentConfirmed,
    customerConfirmed,
    normalizedText,
  };
}
