import { NextResponse } from "next/server";
import { isRequestBodyTooLarge, readBoundedText } from "@/lib/security/request-body";
import { validateTwilioWebhook } from "@/modules/calls/service";
import { createProviderWebhookEventId, enqueueTelecomJob } from "@/modules/calls/telecom-jobs";

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await readBoundedText(request, 256 * 1024);
  } catch (error) {
    const status = isRequestBodyTooLarge(error) ? 413 : 400;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: status === 413 ? "PAYLOAD_TOO_LARGE" : "INVALID_BODY",
          message: status === 413 ? "Payload too large." : "Invalid webhook body.",
        },
      },
      { status },
    );
  }
  const payload = Object.fromEntries(new URLSearchParams(rawBody));

  const valid = await validateTwilioWebhook(request, payload);
  if (!valid) {
    return NextResponse.json({ success: false, error: { code: "INVALID_WEBHOOK_SIGNATURE", message: "Invalid webhook signature." } }, { status: 401 });
  }

  try {
    const providerEventId = createProviderWebhookEventId("twilio", payload);
    const job = await enqueueTelecomJob({
      type: "TELECOM_PROCESS_PROVIDER_EVENT",
      idempotencyKey: providerEventId,
      eventId: providerEventId,
      metadata: {
        providerType: "twilio",
        payload,
      },
      entityType: "ProviderWebhookEvent",
      entityId: providerEventId,
    });
    return NextResponse.json({ success: true, data: { accepted: true, jobId: job.id } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "TWILIO_WEBHOOK_FAILED", message: "Twilio webhook rejected." } },
      { status: 400 }
    );
  }
}
