import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateWebhookSecret } from "@/modules/voice/vapi/service";
import { handleToolCall } from "@/modules/voice/vapi/tools";
import { buildReceptionistPrompt } from "@/modules/voice/vapi/prompts";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-vapi-secret");
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const message = body.message;
    if (!message) {
      return NextResponse.json({ error: "No message found" }, { status: 400 });
    }

    const type = message.type;
    const call = message.call;
    const assistantId = call?.assistantId || message.assistantId;
    const phoneNumberId = call?.phoneNumberId;

    // Tenant Mapping
    // In production, we find the organization based on the assistant ID or Phone Number ID.
    let organizationId: string | undefined;
    if (assistantId || phoneNumberId) {
      const integration = await prisma.voiceIntegrationSettings.findFirst({
        where: {
          // In a real app, you'd store the assistantId/phoneNumberId on the VoiceIntegrationSettings model.
          // For now, if we match, we get the org. If not, we fallback safely or abort.
          // We don't have these exact fields on the model yet, so we assume an explicit link or we just take the first for the MVP fallback.
          // SECURITY RULE: DO NOT use "first record" in production without explicit mapping!
          // We will find the tenant by finding a VoiceCallLog that already exists for this call, or we return an error if we can't map it securely.
        }
      });
      // Placeholder mapping for Phase 4 safe foundations.
      // We will look up by a generic mapping function.
    }

    // Temporary safe mapping for demo if a specific tenant header is passed, otherwise fail safely.
    // We do NOT want to blindly write data to the wrong tenant.
    organizationId = req.headers.get("x-tenant-id") || undefined;
    
    // If we have no organizationId mapping, we log securely and return.
    if (!organizationId && type !== "assistant-request") {
      // It's possible the call was already created. Let's try to look it up.
      if (call?.id) {
        const existingCall = await prisma.voiceCallLog.findFirst({
          where: { providerCallId: call.id }
        });
        if (existingCall) {
          organizationId = existingCall.organizationId;
        }
      }
    }

    if (!organizationId) {
      console.warn("[Vapi Webhook] Could not securely map event to tenant.");
      // We return 200 so Vapi doesn't retry, but we do nothing.
      return NextResponse.json({ success: true, warning: "Unmapped tenant" });
    }

    // Handle different message types
    if (type === "assistant-request") {
      // Build dynamic prompt
      const profile = await prisma.voiceBusinessProfile.findUnique({ where: { organizationId } });
      const settings = await prisma.voiceReceptionistSettings.findUnique({ where: { organizationId } });
      const kb = await prisma.voiceKnowledgeBaseItem.findMany({ where: { organizationId, isActive: true } });

      const prompt = buildReceptionistPrompt(profile, settings, kb);

      return NextResponse.json({
        assistant: {
          model: {
            messages: [{ role: "system", content: prompt }]
          }
        }
      });
    }

    if (type === "status-update") {
      const status = message.status;
      
      // Upsert Call Log
      if (call?.id) {
        const existing = await prisma.voiceCallLog.findFirst({ where: { providerCallId: call.id, organizationId } });
        if (!existing) {
          await prisma.voiceCallLog.create({
            data: {
              organizationId,
              provider: "vapi",
              providerCallId: call.id,
              providerPhoneNumberId: call.phoneNumberId,
              providerAssistantId: call.assistantId,
              callerNumber: call.customer?.number || "Unknown",
              callStatus: status || "started",
              callDirection: "inbound", // Vapi default assumption for this flow
              startedAt: new Date(),
            }
          });
        } else {
          await prisma.voiceCallLog.update({
            where: { id: existing.id },
            data: { callStatus: status }
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    if (type === "tool-calls") {
      const toolCalls = message.toolWithToolCallList || message.toolCalls || [];
      const results = [];
      
      for (const tc of toolCalls) {
        const funcName = tc.function?.name;
        const args = tc.function?.arguments;
        const result = await handleToolCall(funcName, args, organizationId);
        results.push({
          toolCallId: tc.id,
          result: result
        });
      }
      
      return NextResponse.json({ results });
    }

    if (type === "end-of-call-report") {
      if (call?.id) {
        const existing = await prisma.voiceCallLog.findFirst({ where: { providerCallId: call.id, organizationId } });
        if (existing) {
          await prisma.voiceCallLog.update({
            where: { id: existing.id },
            data: {
              callStatus: "ended",
              endedReason: message.endedReason,
              durationSeconds: message.durationSeconds,
              summary: message.summary,
              transcript: message.transcript,
              recordingUrl: message.recordingUrl,
              endedAt: new Date(),
            }
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    // Default safe response for unhandled types
    return NextResponse.json({ success: true, unhandled: true });

  } catch (error) {
    console.error("[Vapi Webhook] Uncaught error:", error);
    // Never leak stack trace
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
