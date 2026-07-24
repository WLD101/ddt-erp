import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isRequestBodyTooLarge,
  readBoundedText,
} from "@/lib/security/request-body";
import { isFreshWebhookTimestamp } from "@/lib/security/webhook-timestamp";
import {
  checkAndAcquireActiveCallSlot,
  releaseActiveCallSlot,
} from "@/modules/voice/billing/usage";
import { isIpAllowed } from "@/modules/voice/security/ip-utils";
import { markVapiActiveSlotAcquired } from "@/modules/voice/vapi/call-ledger";
import { ingestVapiWebhook } from "@/modules/voice/vapi/ingestion";

const MAX_VAPI_WEBHOOK_BYTES = 2 * 1024 * 1024;
const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;

function safeSecretEquals(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

function hasValidHmacSignature(
  rawBody: string,
  signature: string | null,
  expectedSecret: string | undefined,
  timestamp: string | null,
) {
  if (!signature || !expectedSecret) return false;
  const normalizedSignature = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;
  const computedSignature = crypto
    .createHmac("sha256", expectedSecret)
    .update(timestamp ? `${timestamp}.${rawBody}` : rawBody)
    .digest("hex");
  return safeSecretEquals(normalizedSignature, computedSignature);
}

function hasFreshWebhookTimestamp(timestamp: string | null) {
  const toleranceSeconds = Number(
    process.env.VAPI_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS ||
      DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  );
  return isFreshWebhookTimestamp({
    timestamp,
    toleranceSeconds:
      Number.isFinite(toleranceSeconds) && toleranceSeconds > 0
        ? toleranceSeconds
        : DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  });
}

export function isAuthorizedVapiWebhook(request: Request, rawBody: string) {
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (!expectedSecret) return process.env.NODE_ENV !== "production";

  const authMode = (
    process.env.VAPI_WEBHOOK_AUTH_MODE ||
    (process.env.NODE_ENV === "production" ? "hmac" : "any")
  ).toLowerCase();
  const timestamp = request.headers.get(
    process.env.VAPI_WEBHOOK_TIMESTAMP_HEADER || "x-vapi-timestamp",
  );
  const hmacValid = hasValidHmacSignature(
    rawBody,
    request.headers.get(
      process.env.VAPI_WEBHOOK_SIGNATURE_HEADER || "x-vapi-signature",
    ),
    expectedSecret,
    timestamp,
  );
  const timestampRequired =
    process.env.VAPI_WEBHOOK_REQUIRE_TIMESTAMP === "true" ||
    (process.env.NODE_ENV === "production" && authMode === "hmac");

  if (authMode === "hmac") {
    return hmacValid && (!timestampRequired || hasFreshWebhookTimestamp(timestamp));
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  return (
    safeSecretEquals(bearerToken, expectedSecret) ||
    safeSecretEquals(request.headers.get("x-vapi-secret"), expectedSecret) ||
    (hmacValid && (!timestampRequired || hasFreshWebhookTimestamp(timestamp)))
  );
}

function isAllowedSourceIp(request: Request) {
  const allowedCidrs = (process.env.VAPI_ALLOWED_CIDRS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (allowedCidrs.length === 0) return true;

  const sourceIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "";
  return Boolean(sourceIp) && isIpAllowed(sourceIp, allowedCidrs);
}

function triggerVoiceJobProcessor(request: Request) {
  const jobsSecret = process.env.VOICE_JOBS_SECRET;
  if (!jobsSecret) return;

  void fetch(new URL("/api/voice/jobs/process", request.url), {
    method: "POST",
    headers: { authorization: `Bearer ${jobsSecret}` },
  }).catch((error) => {
    console.warn("[Vapi Webhook] The durable job remains queued after trigger failure.", error);
  });
}

async function handleAssistantRequest(
  ingestion: Awaited<ReturnType<typeof ingestVapiWebhook>>,
) {
  const mapping = ingestion.mapping;
  if (!mapping?.organizationId || !mapping.vapiAssistantId) {
    return NextResponse.json({
      error: "This phone number is not mapped to an active WhatsQuery voice agent.",
    });
  }

  if (!ingestion.duplicate) {
    const organization = await prisma.organization.findUnique({
      where: { id: mapping.organizationId },
      select: {
        walletBalance: true,
        perMinuteRate: true,
        VoiceUsageMeter: { select: { activeCalls: true } },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "The mapped WhatsQuery tenant is unavailable." });
    }

    const activeCalls = organization.VoiceUsageMeter?.activeCalls || 0;
    const reserveCost = activeCalls * Number(organization.perMinuteRate) * 5;
    if (Number(organization.walletBalance) - reserveCost <= 0) {
      return NextResponse.json({
        error: "This account has insufficient calling balance. Please contact the business.",
      });
    }

    const slot = await checkAndAcquireActiveCallSlot(mapping.organizationId);
    if (!slot.acquired) {
      return NextResponse.json({
        error: "All lines are currently busy. Please try again shortly.",
      });
    }

    try {
      await markVapiActiveSlotAcquired({
        mapping,
        message: ingestion.message,
        receivedAt: ingestion.event.receivedAt,
      });
    } catch (error) {
      await releaseActiveCallSlot(mapping.organizationId);
      throw error;
    }
  }

  return NextResponse.json({ assistantId: mapping.vapiAssistantId });
}

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await readBoundedText(request, MAX_VAPI_WEBHOOK_BYTES);
  } catch (error) {
    if (isRequestBodyTooLarge(error)) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!isAllowedSourceIp(request)) {
    console.warn("[Vapi Webhook] Rejected a source outside VAPI_ALLOWED_CIDRS.");
    return NextResponse.json({ error: "Unauthorized source" }, { status: 401 });
  }
  if (!isAuthorizedVapiWebhook(request, rawBody)) {
    console.warn("[Vapi Webhook] Rejected an invalid webhook credential.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    // Durable event persistence and deduplication always happen before business processing.
    const ingestion = await ingestVapiWebhook(body);
    triggerVoiceJobProcessor(request);

    if (ingestion.eventType === "assistant-request") {
      return handleAssistantRequest(ingestion);
    }
    if (ingestion.eventType === "tool-calls") {
      const toolCalls =
        ingestion.message.toolWithToolCallList ||
        ingestion.message.toolCalls ||
        [];
      return NextResponse.json({
        results: toolCalls.map((toolCall: any) => ({
          toolCallId: toolCall.id,
          result: JSON.stringify({
            success: true,
            status: "queued",
            message:
              "The request was accepted for WhatsQuery processing. Do not describe it as confirmed until the business workflow confirms it.",
          }),
        })),
      });
    }

    return NextResponse.json({
      success: true,
      accepted: true,
      duplicate: ingestion.duplicate,
      eventId: ingestion.event.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook ingestion failed.";
    const status = message.includes("message.type")
      ? 400
      : message.includes("controlled pilot")
        ? 403
        : 500;
    console.error("[Vapi Webhook] Ingestion failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      {
        error:
          status === 400
            ? "Invalid webhook event"
            : status === 403
              ? "Tenant is not approved for the controlled pilot"
              : "Webhook ingestion failed",
      },
      { status },
    );
  }
}
