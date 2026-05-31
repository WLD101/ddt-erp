// modules/voice/vapi/service.ts

export function getVapiEnvStatus() {
  const isEnabled = process.env.VOICE_CALLING_ENABLED === "true";
  
  return {
    hasPrivateKey: !!process.env.VAPI_PRIVATE_API_KEY,
    hasPublicKey: !!process.env.VAPI_PUBLIC_KEY,
    hasWebhookSecret: !!process.env.VAPI_WEBHOOK_SECRET,
    hasDefaultAssistantId: !!process.env.VAPI_DEFAULT_ASSISTANT_ID,
    hasDefaultPhoneNumberId: !!process.env.VAPI_DEFAULT_PHONE_NUMBER_ID,
    callingEnabled: isEnabled,
    webhookUrl: process.env.VAPI_SERVER_URL || process.env.VOICE_PUBLIC_APP_URL ? `${process.env.VOICE_PUBLIC_APP_URL}/api/voice/vapi/webhook` : undefined
  };
}

export function validateWebhookSecret(secret: string | null): boolean {
  const configuredSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (!configuredSecret) {
    // If we haven't configured a secret, we allow it, but in production we should.
    return true;
  }
  return secret === configuredSecret;
}

export async function fetchAssistantDetails(assistantId: string) {
  const apiKey = process.env.VAPI_PRIVATE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[Vapi Service] Failed to fetch assistant:", err);
    return null;
  }
}
