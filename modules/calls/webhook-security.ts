import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { TelecomError } from "./errors";

const ASTERISK_REPLAY_WINDOW_SECONDS = 300;

export async function validateAsteriskHmacWebhook(input: {
  method: string;
  pathname: string;
  rawBody: string;
  timestamp: string | null;
  nonce: string | null;
  signature: string | null;
  tenantId?: string | null;
}) {
  const secrets = [
    process.env.ASTERISK_WEBHOOK_SECRET,
    process.env.ASTERISK_WEBHOOK_SECRET_PREVIOUS,
  ].filter((secret): secret is string => !!secret);

  if (secrets.length === 0 && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!input.timestamp || !input.nonce || !input.signature) {
    throw new TelecomError("INVALID_WEBHOOK_SIGNATURE", "Asterisk webhook signature headers are required.", 401);
  }

  const timestampMs = Number(input.timestamp) * 1000;
  if (!Number.isFinite(timestampMs)) {
    throw new TelecomError("INVALID_WEBHOOK_SIGNATURE", "Asterisk webhook timestamp is invalid.", 401);
  }

  const ageSeconds = Math.abs(Date.now() - timestampMs) / 1000;
  if (ageSeconds > ASTERISK_REPLAY_WINDOW_SECONDS) {
    throw new TelecomError("WEBHOOK_REPLAY_DETECTED", "Asterisk webhook timestamp is outside the replay window.", 401);
  }

  const signedMaterial = [
    input.method.toUpperCase(),
    input.pathname,
    input.timestamp,
    input.nonce,
    input.rawBody,
  ].join("\n");

  const valid = secrets.some((secret) => safeCompare(createAsteriskWebhookSignature(secret, signedMaterial), input.signature || ""));
  if (!valid) {
    throw new TelecomError("INVALID_WEBHOOK_SIGNATURE", "Asterisk webhook signature is invalid.", 401);
  }

  try {
    await prisma.telecomWebhookNonce.create({
      data: {
        provider: "asterisk",
        nonce: input.nonce,
        tenantId: input.tenantId || null,
        expiresAt: new Date(Date.now() + ASTERISK_REPLAY_WINDOW_SECONDS * 1000),
      },
    });
  } catch {
    throw new TelecomError("WEBHOOK_REPLAY_DETECTED", "Asterisk webhook nonce has already been used.", 409);
  }

  return true;
}

export function createAsteriskWebhookSignature(secret: string, material: string) {
  return crypto.createHmac("sha256", secret).update(material).digest("hex");
}

function safeCompare(expected: string, actual: string) {
  const normalizedActual = actual.replace(/^sha256=/i, "");
  const left = Buffer.from(expected);
  const right = Buffer.from(normalizedActual);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
