import "server-only";

import { TelecomError } from "./errors";

export function validateTelecomProviderEnv() {
  const problems: string[] = [];

  if (process.env.VOICE_TWILIO_CALLING_ENABLED === "true") {
    requireEnv(problems, "VOICE_TWILIO_ACCOUNT_SID", process.env.VOICE_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID);
    requireEnv(problems, "VOICE_TWILIO_AUTH_TOKEN", process.env.VOICE_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN);
    requireEnv(problems, "VOICE_TWILIO_PHONE_NUMBER", process.env.VOICE_TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER);
    requireEnv(problems, "VOICE_PUBLIC_APP_URL", process.env.VOICE_PUBLIC_APP_URL || process.env.NEXTAUTH_URL);
  }

  if (process.env.VOICE_ASTERISK_CALLING_ENABLED === "true") {
    requireEnv(problems, "ASTERISK_ORIGINATE_URL", process.env.ASTERISK_ORIGINATE_URL);
    requireEnv(problems, "ASTERISK_API_TOKEN", process.env.ASTERISK_API_TOKEN);
    requireEnv(problems, "ASTERISK_WEBHOOK_SECRET", process.env.ASTERISK_WEBHOOK_SECRET);
  }

  if (problems.length > 0) {
    throw new TelecomError(
      "PROVIDER_UNAVAILABLE",
      `Telecom provider configuration is incomplete: ${problems.join(", ")}`,
      500
    );
  }
}

function requireEnv(problems: string[], name: string, value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || /replace|placeholder|changeme|example/i.test(trimmed)) {
    problems.push(name);
  }
}
