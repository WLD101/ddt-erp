import crypto from "crypto";
import type { InitiateCallResult, ProviderWebhookResult, VoiceProvider } from "./VoiceProvider";

type TwilioCredentials = {
  accountSid?: string | null;
  authToken?: string | null;
  fromNumber?: string | null;
};

export class TwilioProvider implements VoiceProvider {
  constructor(private readonly credentials: TwilioCredentials = {}) {}

  async initiateCall(from: string | null, to: string, tenantId: string, metadata: Record<string, unknown> = {}): Promise<InitiateCallResult> {
    const accountSid = this.credentials.accountSid || process.env.VOICE_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
    const authToken = this.credentials.authToken || process.env.VOICE_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = from || this.credentials.fromNumber || process.env.VOICE_TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;
    const externalCallId = `twilio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!accountSid || !authToken || !fromNumber || process.env.VOICE_TWILIO_CALLING_ENABLED !== "true") {
      return {
        externalCallId,
        status: "dry_run",
        raw: { reason: "Twilio calling is not enabled or credentials are missing.", from: fromNumber, to, tenantId, metadata },
      };
    }

    const publicUrl = process.env.VOICE_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    const twimlUrl = process.env.VOICE_TWILIO_TWIML_URL || (publicUrl ? `${publicUrl.replace(/\/$/, "")}/api/calls/twiml` : "");
    const callbackUrl = publicUrl ? `${publicUrl.replace(/\/$/, "")}/api/calls/provider-webhook/twilio` : "";

    if (!twimlUrl || !callbackUrl) {
      throw new Error("VOICE_PUBLIC_APP_URL or VOICE_TWILIO_TWIML_URL is required before Twilio calling can be enabled.");
    }

    const form = new URLSearchParams();
    form.set("To", to);
    form.set("From", fromNumber);
    form.set("Url", twimlUrl);
    form.set("StatusCallback", callbackUrl);
    form.set("StatusCallbackEvent", "initiated ringing answered completed");
    form.set("StatusCallbackMethod", "POST");

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(`Twilio call failed with ${response.status}: ${String(payload.message || "unknown error")}`);
    }

    return {
      externalCallId: String(payload.sid || externalCallId),
      status: String(payload.status || "initiated"),
      raw: payload,
    };
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<ProviderWebhookResult> {
    const callStatus = String(payload.CallStatus || payload.CallStatusCallbackEvent || payload.CallStatusCallback || payload.status || "unknown").toLowerCase();
    return {
      externalCallId: stringOrNull(payload.CallSid) || stringOrNull(payload.Sid),
      fromNumber: stringOrNull(payload.From),
      toNumber: stringOrNull(payload.To),
      direction: normalizeDirection(payload.Direction),
      country: stringOrNull(payload.CalledCountry) || stringOrNull(payload.FromCountry),
      callStatus,
      duration: numberOrNull(payload.CallDuration || payload.Duration),
      recordingUrl: stringOrNull(payload.RecordingUrl),
      transcriptId: stringOrNull(payload.TranscriptionSid),
      cost: this.calculateCost(payload),
      currency: stringOrNull(payload.PriceUnit)?.toUpperCase() || "USD",
      providerPhoneNumberId: stringOrNull(payload.Called),
    };
  }

  async getCallStatus(callId: string) {
    return { callId, status: "unknown", provider: "twilio" };
  }

  async getRecording(callId: string) {
    return { url: null, callId };
  }

  calculateCost(callData: Record<string, unknown>) {
    const price = numberOrNull(callData.Price ?? callData.price ?? callData.cost);
    return price === null ? null : Math.abs(price);
  }
}

export function validateTwilioSignature(params: {
  authToken: string;
  url: string;
  payload: Record<string, string>;
  signature: string | null;
}) {
  if (!params.signature) return false;

  const data = Object.keys(params.payload)
    .sort()
    .reduce((acc, key) => `${acc}${key}${params.payload[key]}`, params.url);

  const expected = crypto.createHmac("sha1", params.authToken).update(data).digest("base64");
  return safeCompare(expected, params.signature);
}

function normalizeDirection(value: unknown) {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("outbound")) return "outbound";
  return "inbound";
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
