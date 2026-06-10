// modules/voice/vapi/service.ts

import { timingSafeEqual } from "node:crypto";

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
    return process.env.NODE_ENV !== "production";
  }
  if (!secret) {
    return false;
  }

  const provided = Buffer.from(secret);
  const expected = Buffer.from(configuredSecret);

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
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

type UpsertVapiAssistantInput = {
  assistantId?: string | null;
  assistantName: string;
  firstMessage: string;
  prompt: string;
  webhookUrl: string;
  toolNames: string[];
};

function buildVapiAssistantPayload(input: UpsertVapiAssistantInput) {
  return {
    name: input.assistantName,
    firstMessage: input.firstMessage,
    server: {
      url: input.webhookUrl,
      secret: process.env.VAPI_WEBHOOK_SECRET || undefined,
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    model: {
      provider: "groq",
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: input.prompt }],
    },
    voice: {
      provider: "cartesia",
      voiceId: "79a125e8-cd45-4c13-8a67-188112f4dd22",
    },
    tools: input.toolNames.map((toolName) => ({
      type: "function",
      function: {
        name: toolName,
        description: `Tenant-scoped Voice tool: ${toolName}`,
        parameters: {
          type: "object",
          additionalProperties: true,
          properties: {},
        },
      },
    })),
  };
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
        provider: "groq",
        model: "llama-3.1-8b-instant",
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

export async function upsertVapiAssistant(input: UpsertVapiAssistantInput) {
  const apiKey = getVapiPrivateApiKey();
  if (!apiKey) {
    throw new Error("Vapi private API key is not configured.");
  }

  const payload = buildVapiAssistantPayload(input);
  const endpoint = input.assistantId
    ? `https://api.vapi.ai/assistant/${input.assistantId}`
    : "https://api.vapi.ai/assistant";
  const method = input.assistantId ? "PATCH" : "POST";

  const res = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vapi assistant ${input.assistantId ? "update" : "create"} failed (${res.status}): ${body || res.statusText}`);
  }

  return res.json();
}

export async function syncVapiCallCostByProviderCallId(providerCallId: string) {
  const apiKey = getVapiPrivateApiKey();
  if (!apiKey) {
    return {
      synced: false,
      reason: "Vapi private API key is not configured.",
      providerCallId,
    };
  }

  // Placeholder for a later reconciliation job. Some providers may delay cost
  // details until after the webhook lifecycle, so we keep a single safe entrypoint
  // to backfill cost data by providerCallId when that API contract is finalized.
  return {
    synced: false,
    reason: "Provider call cost backfill is not implemented yet.",
    providerCallId,
  };
}
