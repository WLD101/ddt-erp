import type { InitiateCallResult, ProviderWebhookResult, VoiceProvider } from "./VoiceProvider";

export class AsteriskProvider implements VoiceProvider {
  async initiateCall(from: string | null, to: string, tenantId: string, metadata: Record<string, unknown> = {}): Promise<InitiateCallResult> {
    const originateUrl = process.env.ASTERISK_ORIGINATE_URL;
    const token = process.env.ASTERISK_API_TOKEN;
    const externalCallId = `asterisk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!originateUrl || !token || process.env.VOICE_ASTERISK_CALLING_ENABLED !== "true") {
      return {
        externalCallId,
        status: "dry_run",
        raw: { reason: "Asterisk calling is not enabled or credentials are missing.", from, to, tenantId, metadata },
      };
    }

    const response = await fetch(originateUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ from, to, tenantId, metadata }),
    });

    if (!response.ok) {
      throw new Error(`Asterisk originate failed with ${response.status}`);
    }

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      externalCallId: String(payload.callId || payload.channelId || externalCallId),
      status: String(payload.status || "initiated"),
      raw: payload,
    };
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<ProviderWebhookResult> {
    return {
      externalCallId: stringOrNull(payload.callId) || stringOrNull(payload.channelId),
      fromNumber: stringOrNull(payload.from),
      toNumber: stringOrNull(payload.to),
      direction: String(payload.direction || "inbound").toLowerCase(),
      country: stringOrNull(payload.country),
      callStatus: String(payload.status || payload.callStatus || "unknown").toLowerCase(),
      duration: numberOrNull(payload.durationSeconds ?? payload.duration),
      recordingUrl: stringOrNull(payload.recordingUrl),
      transcriptId: stringOrNull(payload.transcriptId),
      cost: numberOrNull(payload.cost),
      currency: stringOrNull(payload.currency) || "PKR",
    };
  }

  async getCallStatus(callId: string) {
    return { callId, status: "unknown", provider: "asterisk" };
  }

  async getRecording(callId: string) {
    return { url: null, callId };
  }

  calculateCost(callData: Record<string, unknown>) {
    return numberOrNull(callData.cost);
  }
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}
