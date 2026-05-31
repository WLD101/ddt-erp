import { NextResponse } from "next/server";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";

export async function GET() {
  const status = getVapiEnvStatus();
  return NextResponse.json({
    status: "ok",
    vapi: {
      configured: status.hasPrivateKey && status.hasPublicKey,
      callingEnabled: status.callingEnabled,
      webhookConfigured: !!status.webhookUrl,
    }
  });
}
