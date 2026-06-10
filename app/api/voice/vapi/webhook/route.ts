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
  let validSecret = false;
  
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;

  if (expectedSecret && sigHeader) {
    const hmac = crypto.createHmac("sha256", expectedSecret);
    const computedSig = hmac.update(rawBody).digest("hex");
    if (safeSecretEquals(sigHeader, computedSig)) {
      validSecret = true;
    }
  }

  // 1. Vector 1: Vapi CIDR Restriction (Production Only)
  if (process.env.NODE_ENV === "production") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "";
    // Lightweight check for Vapi CIDR: 167.150.224.0/23
    // 167.150.224.0 to 167.150.225.255
    const isVapiIp = ip.startsWith("167.150.224.") || ip.startsWith("167.150.225.");
    if (!isVapiIp) {
      console.warn(`[Vapi Webhook] Dropping request from non-Vapi IP: ${ip}`);
      return NextResponse.json({ error: "Unauthorized IP" }, { status: 401 });
    }
  } else {
    validSecret = true; // In dev, allow if signature matches or just allow completely. But wait, if we want to allow all IPs in dev, we just bypass CIDR.
  }

  // Allow bypass in dev for local testing if no secret configured
  if (process.env.NODE_ENV !== "production" && !expectedSecret) {
    validSecret = true;
  }

  if (!validSecret) {
    console.error("[Vapi Webhook] Unauthorized request - Invalid Signature");
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

  let resolvedMapping: { organizationId?: string; voiceBusinessProfileId?: string | null; voiceAgentId?: string | null } | null = null;
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

  // 1.5 Vector 2: SIP Trunk IP Access Control List (ACL)
  if (type === "assistant-request") {
    const callerIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "";
    const allowedSipCidrs = (process.env.ALLOWED_SIP_CIDRS || "").split(",").map(s => s.trim()).filter(Boolean);
    
    // We only enforce SIP ACL if the env var is set, to avoid breaking systems without it configured.
    // If we have an agent with a sipUri, and it's an inbound call from SIP, the provider is usually 'sip' or 'vapi'.
    // Vapi might proxy the SIP call. If Vapi proxies it, Vapi's IP is already allowed in Vector 1.
    // If the SIP provider hits our API directly (e.g. custom SIP webhook), we'd enforce this.
    // We will log and enforce if allowedSipCidrs are provided.
    if (allowedSipCidrs.length > 0) {
      const { isIpAllowed } = require("@/modules/voice/security/ip-utils");
      if (!isIpAllowed(callerIp, allowedSipCidrs)) {
        console.warn(`[SIP Guard] Dropped request from unauthorized IP: ${callerIp}`);
        return NextResponse.json({ error: "Unauthorized SIP IP" }, { status: 401 });
      }
    }
  }

  // 2. Wallet Balance Guardrail & Deduction
  if (resolvedMapping?.organizationId) {
    const organizationId = resolvedMapping.organizationId as string;
    const [org, meter] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { walletBalance: true, perMinuteRate: true }
      }),
      prisma.voiceUsageMeter.findUnique({
        where: { organizationId: organizationId },
        select: { activeCalls: true }
      })
    ]);

    if (org) {
      if (type === "assistant-request") {
        // Vector 3: Concurrency Reserve Cost Protection
        const activeCalls = meter?.activeCalls || 0;
        const reserveCostPerCall = Number(org.perMinuteRate) * 5; // Reserve 5 mins per active call
        const totalReserve = activeCalls * reserveCostPerCall;
        const availableBalance = Number(org.walletBalance) - totalReserve;

        if (availableBalance <= 0) {
          console.warn(`[Vapi Webhook] Blocking assistant-request for ${organizationId}. Balance: ${org.walletBalance}, Active Calls: ${activeCalls}, Reserve Needed: ${totalReserve}`);
          return NextResponse.json({
            assistant: {
              firstMessage: "The account associated with this number has insufficient balance. Please contact support.",
              endCallAfterSpoken: true,
              model: { provider: "vapi", model: "vapi", messages: [{ role: "system", content: "End call." }] }
            }
          });
        }
        
        // Atomically acquire slot to prevent race condition bypasses
        const slot = await checkAndAcquireActiveCallSlot(organizationId);
        if (!slot.acquired) {
          console.warn(`[Vapi Webhook] Concurrency limit blocked assistant-request for ${organizationId}.`);
          return NextResponse.json({
            assistant: {
              firstMessage: "All lines are currently busy. Please try again later.",
              endCallAfterSpoken: true,
              model: { provider: "vapi", model: "vapi", messages: [{ role: "system", content: "End call." }] }
            }
          });
        }
      } else if (type === "call.ended" || type === "end-of-call-report") {
        const endedAt = payload.call?.endedAt;
        const startedAt = payload.call?.startedAt;
        let durationMins = 0;
        
        if (endedAt && startedAt) {
          const start = new Date(startedAt);
          const end = new Date(endedAt);
          const durationSeconds = (end.getTime() - start.getTime()) / 1000;
          durationMins = Math.ceil(durationSeconds / 60);
        } else if (payload.call?.durationSeconds) {
          durationMins = Math.ceil(payload.call.durationSeconds / 60);
        } else if (payload.durationSeconds) {
          durationMins = Math.ceil(payload.durationSeconds / 60);
        } else if (payload.duration) {
           // Some providers return duration in seconds.
          durationMins = Math.ceil(payload.duration / 60);
        }

        if (durationMins > 0) {
          const cost = durationMins * Number(org.perMinuteRate);
          console.log(`[Vapi Webhook] Call ended for ${organizationId}, duration: ${durationMins}m, deducting: ${cost} PKR`);
          
          await prisma.$transaction(async (tx) => {
            await tx.organization.update({
              where: { id: organizationId },
              data: { walletBalance: { decrement: cost } }
            });
            
            const meter = await tx.voiceUsageMeter.findUnique({
              where: { organizationId: organizationId }
            });
            
            if (meter) {
              await tx.voiceUsageMeter.update({
                where: { organizationId: organizationId },
                data: { callMinutesThisMonth: { increment: durationMins } }
              });
            } else {
              await tx.voiceUsageMeter.create({
                data: { organizationId: organizationId, callMinutesThisMonth: durationMins }
              });
            }
          });
        }
      }
    }
  }

  // 3. Quickly insert to VoiceWebhookEvent
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
       // Slot is now acquired during assistant-request to prevent race conditions.
    } else if (type === "end-of-call-report" || type === "call.ended" || (type === "status-update" && payload.status === "ended")) {
      await releaseActiveCallSlot(resolvedMapping.organizationId);
    }
  }

  // 4. Enqueue job for background processing
  if (status !== "mapping_failed") {
    await enqueueVoiceJob({
      organizationId: resolvedMapping!.organizationId,
      voiceAgentId: resolvedMapping?.voiceAgentId,
      type: "process_webhook_event",
      payload: { eventId: webhookEvent.id },
    });
    
    fetch(new URL('/api/voice/jobs/process', request.url).toString(), { method: 'POST' }).catch(() => {});
  }

  // 5. Return fast response
  return NextResponse.json({ success: true, eventId: webhookEvent.id });
}
