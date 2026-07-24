// modules/voice/vapi/service.ts

import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { reconcileVoiceUsageMeterFromCallLogs } from "@/modules/voice/usage-reconciliation";

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseProviderDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value > 10_000_000_000 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function readProviderPath(source: any, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, part) => acc?.[part], source);
    if (typeof value !== "undefined" && value !== null && value !== "") return value;
  }
  return null;
}

function extractProviderDurationSeconds(call: any, existingDuration?: number | null) {
  const directDuration =
    toNumberOrNull(call?.durationSeconds) ??
    toNumberOrNull(call?.duration) ??
    toNumberOrNull(call?.analysis?.durationSeconds) ??
    toNumberOrNull(call?.analysis?.duration);

  if (directDuration !== null) return Math.max(0, Math.round(directDuration));

  const startedAt = parseProviderDate(readProviderPath(call, ["startedAt", "startTime", "createdAt"]));
  const endedAt = parseProviderDate(readProviderPath(call, ["endedAt", "endTime", "updatedAt"]));
  if (startedAt && endedAt && endedAt.getTime() >= startedAt.getTime()) {
    return Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
  }

  return existingDuration ?? null;
}

function extractProviderCost(call: any) {
  return (
    toNumberOrNull(call?.costUsd) ??
    toNumberOrNull(call?.cost) ??
    toNumberOrNull(call?.analysis?.costUsd) ??
    toNumberOrNull(call?.analysis?.cost)
  );
}

function getConfiguredWebhookUrl() {
  if (process.env.VAPI_SERVER_URL) {
    return process.env.VAPI_SERVER_URL;
  }

  if (process.env.VOICE_PUBLIC_APP_URL) {
    return `${process.env.VOICE_PUBLIC_APP_URL}/api/webhooks/vapi`;
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
  recordingEnabled: boolean;
  recordingDisclosureEnabled: boolean;
  recordingDisclosureType: "verbal" | "stay-on-line";
  recordingDisclosureText?: string | null;
  transcriptionEnabled: boolean;
};

export function buildVapiAssistantPayload(input: UpsertVapiAssistantInput) {
  const credentialId = process.env.VAPI_SERVER_CREDENTIAL_ID?.trim();
  const compliancePlan =
    input.recordingEnabled && input.recordingDisclosureEnabled
      ? {
          recordingConsentPlan: {
            type: input.recordingDisclosureType,
            message: input.recordingDisclosureText,
            ...(input.recordingDisclosureType === "stay-on-line"
              ? { waitSeconds: 3 }
              : {}),
          },
        }
      : undefined;

  return {
    name: input.assistantName,
    firstMessage: input.firstMessage,
    server: {
      url: input.webhookUrl,
      ...(credentialId
        ? { credentialId }
        : { secret: process.env.VAPI_WEBHOOK_SECRET || undefined }),
    },
    artifactPlan: {
      recordingEnabled: input.recordingEnabled,
      loggingEnabled: input.transcriptionEnabled,
      transcriptPlan: {
        enabled: input.transcriptionEnabled,
        assistantName: "Assistant",
        userName: "Customer",
      },
    },
    ...(compliancePlan ? { compliancePlan } : {}),
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

  const callLog = await prisma.voiceCallLog.findFirst({
    where: { provider: "vapi", providerCallId },
    select: {
      id: true,
      organizationId: true,
      durationSeconds: true,
      costUsd: true,
      costBreakdownJson: true,
      recordingUrl: true,
    },
  });

  if (!callLog) {
    return {
      synced: false,
      reason: "No local call log is mapped to this provider call ID.",
      providerCallId,
    };
  }

  const response = await fetch(`https://api.vapi.ai/call/${encodeURIComponent(providerCallId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return {
      synced: false,
      reason: `Provider call lookup failed (${response.status}): ${body || response.statusText}`,
      providerCallId,
      callLogId: callLog.id,
    };
  }

  const providerCall = await response.json();
  const durationSeconds = extractProviderDurationSeconds(providerCall, callLog.durationSeconds);
  const costUsd = extractProviderCost(providerCall) ?? callLog.costUsd;
  const costBreakdown =
    providerCall?.costBreakdown ||
    providerCall?.costBreakdownJson ||
    providerCall?.analysis?.costBreakdown ||
    null;
  const recordingUrl =
    providerCall?.recordingUrl ||
    providerCall?.recording?.url ||
    providerCall?.artifact?.recordingUrl ||
    callLog.recordingUrl ||
    null;

  await prisma.voiceCallLog.update({
    where: { id: callLog.id },
    data: {
      durationSeconds,
      costUsd,
      costBreakdownJson: costBreakdown ? JSON.stringify(costBreakdown) : callLog.costBreakdownJson,
      recordingUrl,
      usageMetricsSource: "provider_api",
    },
  });

  await reconcileVoiceUsageMeterFromCallLogs(callLog.organizationId);

  return {
    synced: true,
    providerCallId,
    callLogId: callLog.id,
    durationSeconds,
    costUsd,
  };
}
