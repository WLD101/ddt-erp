import { NextResponse } from "next/server";

import {
  isRequestBodyTooLarge,
  readBoundedText,
} from "@/lib/security/request-body";
import { verifySha256HmacSignature } from "@/lib/security/webhook-signatures";
import { processWhatsappWebhookPayload, verifyWhatsappChallenge } from "@/modules/voice/whatsapp/service";

const MAX_WHATSAPP_WEBHOOK_BYTES = 512 * 1024;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const challenge = await verifyWhatsappChallenge({
    mode: url.searchParams.get("hub.mode"),
    token: url.searchParams.get("hub.verify_token"),
    challenge: url.searchParams.get("hub.challenge"),
  });

  if (!challenge) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await readBoundedText(request, MAX_WHATSAPP_WEBHOOK_BYTES);
  } catch (error) {
    if (isRequestBodyTooLarge(error)) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!verifySha256HmacSignature({
    body: rawBody,
    signature: request.headers.get("x-hub-signature-256"),
    secret: process.env.VOICE_WHATSAPP_APP_SECRET,
  })) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: Parameters<typeof processWhatsappWebhookPayload>[0];
  try {
    payload = JSON.parse(rawBody) as Parameters<typeof processWhatsappWebhookPayload>[0];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await processWhatsappWebhookPayload(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[WhatsApp Webhook] Failed to process webhook", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
