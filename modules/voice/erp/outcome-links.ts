export function buildVoiceErpIdempotencyKey(input: {
  organizationId: string;
  branchId?: string | null;
  providerCallId?: string | null;
  requestId: string;
  outcomeType: string;
}) {
  return [
    "voice-erp",
    input.outcomeType,
    input.organizationId,
    input.branchId || "no-branch",
    input.providerCallId || "no-call",
    input.requestId,
  ].join(":");
}

export type VoiceOutcomeLinkRecord = {
  idempotencyKey: string;
  sourceType: "VoiceOrderRequest" | "VoiceReservationRequest" | "VoiceLead";
  sourceId: string;
  outcomeType: string;
  outcomeId?: string | null;
  providerCallId?: string | null;
  notes?: string | null;
};
