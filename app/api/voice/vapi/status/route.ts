import { NextResponse } from "next/server";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";

export async function GET() {
  const status = getVapiEnvStatus();
  return NextResponse.json({
    status: "ok",
    foundation: {
      product: "WhatsQuery Voice",
      callingLive: false,
      note: "AI receptionist foundation is deployed. Real calling remains incomplete until provider integration and phone mapping are verified.",
    },
    vapi: {
      configured: status.hasPrivateKey && status.hasPublicKey,
      callingEnabled: status.callingEnabled,
      webhookConfigured: !!status.webhookUrl,
    },
    safeguards: {
      erpWritesEnabled: process.env.VOICE_ERP_WRITE_ENABLED === "true",
      restaurantWorkflowsEnabled: process.env.VOICE_RESTAURANT_WORKFLOWS_ENABLED === "true",
    },
  });
}
