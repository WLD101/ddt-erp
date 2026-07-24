import { NextResponse } from "next/server";
import { isRequestBodyTooLarge, readBoundedText } from "@/lib/security/request-body";
import { validateAsteriskWebhook } from "@/modules/calls/service";
import { createProviderWebhookEventId, enqueueTelecomJob } from "@/modules/calls/telecom-jobs";

export async function POST(request: Request) {
  try {
    const rawBody = await readBoundedText(request, 256 * 1024);
    await validateAsteriskWebhook(request, rawBody);
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const providerEventId = createProviderWebhookEventId("asterisk", payload);
    const job = await enqueueTelecomJob({
      type: "TELECOM_PROCESS_PROVIDER_EVENT",
      idempotencyKey: providerEventId,
      eventId: providerEventId,
      metadata: {
        providerType: "asterisk",
        payload,
      },
      entityType: "ProviderWebhookEvent",
      entityId: providerEventId,
    });
    return NextResponse.json({ success: true, data: { accepted: true, jobId: job.id } });
  } catch (error) {
    const status = isRequestBodyTooLarge(error) ? 413 : 400;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: status === 413 ? "PAYLOAD_TOO_LARGE" : "ASTERISK_WEBHOOK_FAILED",
          message: status === 413 ? "Payload too large." : "Asterisk webhook rejected.",
        },
      },
      { status }
    );
  }
}
