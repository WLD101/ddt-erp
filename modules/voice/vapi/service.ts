// modules/voice/vapi/service.ts

function getConfiguredWebhookUrl() {
  if (process.env.VAPI_SERVER_URL) {
    return process.env.VAPI_SERVER_URL;
  }

  if (process.env.VOICE_PUBLIC_APP_URL) {
    return `${process.env.VOICE_PUBLIC_APP_URL}/api/voice/vapi/webhook`;
  }

  return undefined;
}

export function getVapiPrivateApiKey() {
  return process.env.VAPI_PRIVATE_API_KEY || process.env.VOICE_VAPI_API_KEY || null;
}

export function getVapiEnvStatus() {
  const isEnabled = process.env.VOICE_CALLING_ENABLED === "true";
  
  return {
    hasPrivateKey: !!getVapiPrivateApiKey(),
    hasPublicKey: !!process.env.VAPI_PUBLIC_KEY,
    hasWebhookSecret: !!process.env.VAPI_WEBHOOK_SECRET,
    callingEnabled: isEnabled,
    webhookUrl: getConfiguredWebhookUrl(),
  };
}

export function getLegacyBootstrapPhoneNumberId() {
  return process.env.VOICE_BOOTSTRAP_PHONE_NUMBER_ID || null;
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
  const apiKey = getVapiPrivateApiKey();
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

export async function syncVapiAssistantPrompt(assistantId: string, prompt: string) {
  const apiKey = getVapiPrivateApiKey();
  if (!apiKey) {
    throw new Error("Vapi private API key is not configured.");
  }

  const res = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: {
        messages: [{ role: "system", content: prompt }],
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vapi assistant sync failed (${res.status}): ${body || res.statusText}`);
  }

  return res.json();
}
