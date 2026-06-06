import { NextResponse } from "next/server";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";
import { resolveVoiceAgentForWebhook } from "@/modules/voice/agents/service";
import { enqueueVoiceJob } from "@/modules/voice/jobs/service";
import { prisma } from "@/lib/prisma";
import { checkAndAcquireActiveCallSlot, releaseActiveCallSlot } from "@/modules/voice/billing/usage";
import crypto from "crypto";

function safeSecretEquals(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (error) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const reqUrl = new URL(request.url);
  const sigHeader = request.headers.get("x-vapi-signature");
  const headerSecret = request.headers.get("x-vapi-secret");
  let validSecret = false;
  let validationError = "";

  const secret = reqUrl.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;

  if (expectedSecret) {
    if (safeSecretEquals(headerSecret, expectedSecret)) validSecret = true;
    if (safeSecretEquals(secret, expectedSecret)) validSecret = true;
    if (safeSecretEquals(authHeader, `Bearer ${expectedSecret}`)) validSecret = true;
    if (safeSecretEquals(authHeader, expectedSecret)) validSecret = true;
    
    if (!validSecret && sigHeader && process.env.VAPI_WEBHOOK_SECRET) {
      const hmac = crypto.createHmac("sha256", process.env.VAPI_WEBHOOK_SECRET);
      const computedSig = hmac.update(rawBody).digest("hex");
      if (sigHeader === computedSig) {
        validSecret = true;
      }
    }
  }

  if (process.env.NODE_ENV !== "production") {
    validSecret = true;
  }

  if (!validSecret) {
    console.error("[Vapi Webhook] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body.message;
  const type = payload?.type;

  if (!payload || !type) {
    return NextResponse.json({ error: "Missing message type" }, { status: 400 });
  }

  // 1. Resolve Voice Agent
  const callerNumber = payload.call?.customer?.number || payload.call?.customer?.phoneNumber;
  const assistantId = payload.call?.assistantId || payload.assistantId;
  const phoneNumberId = payload.call?.phoneNumberId;
  const systemPhoneNumber = payload.call?.phoneNumber?.number;

  let resolvedMapping: { organizationId?: string; voiceBusinessProfileId?: string; voiceAgentId?: string | null } | null = null;
  let status = "received";
  
  if (assistantId || phoneNumberId) {
    const rawMapping = await resolveVoiceAgentForWebhook({
      assistantId,
      phoneNumberId,
      providerCallId: payload.call?.id,
    });
    resolvedMapping = rawMapping || null;
  }

  if (!resolvedMapping || !resolvedMapping.organizationId) {
    console.warn(`[Vapi Webhook] Failed to resolve mapping for assistantId: ${assistantId}`);
    status = "mapping_failed";
  }

  // 2. Quickly insert to VoiceWebhookEvent
  const webhookEvent = await prisma.voiceWebhookEvent.create({
    data: {
      organizationId: resolvedMapping?.organizationId || null,
      voiceBusinessProfileId: resolvedMapping?.voiceBusinessProfileId || null,
      voiceAgentId: resolvedMapping?.voiceAgentId || null,
      provider: "vapi",
      providerEventId: payload.id || null,
      providerCallId: payload.call?.id || null,
      providerAssistantId: assistantId || null,
      providerPhoneNumberId: phoneNumberId || null,
      eventType: type,
      status,
      rawPayloadJson: JSON.stringify(payload),
    }
  });

  // Track capacity for active calls
  if (resolvedMapping?.organizationId) {
    if (type === "status-update" && payload.status === "in-progress") {
      const slot = await checkAndAcquireActiveCallSlot(resolvedMapping.organizationId);
      if (!slot.acquired) {
         console.warn(`[Vapi Webhook] Capacity full for organization: ${resolvedMapping.organizationId}, reason: ${slot.reason}`);
         // We log it, but since the call is already happening in Vapi, we let it proceed or rely on Vapi's end to handle concurrency.
         // In a pre-call hook, we could block it entirely.
         // Let's mark the webhook event specifically to show it was an over-capacity call.
         await prisma.voiceWebhookEvent.update({
           where: { id: webhookEvent.id },
           data: { errorMessage: `CAPACITY_FULL: ${slot.reason}` }
         });
      }
    } else if (type === "end-of-call-report" || (type === "status-update" && payload.status === "ended")) {
      await releaseActiveCallSlot(resolvedMapping.organizationId);
    }
  }

  // 3. Enqueue job for background processing
  if (status !== "mapping_failed") {
    await enqueueVoiceJob({
      organizationId: resolvedMapping!.organizationId,
      voiceAgentId: resolvedMapping?.voiceAgentId,
      type: "process_webhook_event",
      payload: { eventId: webhookEvent.id },
    });
    
    // Optional: Fetch the API to trigger processing asynchronously so we don't have to wait for cron
    // Doing this asynchronously without awaiting.
    fetch(new URL('/api/voice/jobs/process', request.url).toString(), { method: 'POST' }).catch(() => {});
  }

  // 4. Return fast response
  return NextResponse.json({ success: true, eventId: webhookEvent.id });
}
