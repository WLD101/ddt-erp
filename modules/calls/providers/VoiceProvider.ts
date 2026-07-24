export type InitiateCallInput = {
  from?: string | null;
  to: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
};

export type InitiateCallResult = {
  externalCallId: string;
  status: string;
  raw?: unknown;
};

export type ProviderWebhookResult = {
  externalCallId?: string | null;
  fromNumber?: string | null;
  toNumber?: string | null;
  direction: string;
  country?: string | null;
  callStatus: string;
  duration?: number | null;
  recordingUrl?: string | null;
  transcriptId?: string | null;
  cost?: number | null;
  currency?: string | null;
  providerPhoneNumberId?: string | null;
};

export interface VoiceProvider {
  initiateCall(from: string | null, to: string, tenantId: string, metadata?: Record<string, unknown>): Promise<InitiateCallResult>;
  handleWebhook(payload: Record<string, unknown>): Promise<ProviderWebhookResult>;
  getCallStatus(callId: string): Promise<Record<string, unknown>>;
  getRecording(callId: string): Promise<{ url?: string | null }>;
  calculateCost(callData: Record<string, unknown>): number | null;
}
