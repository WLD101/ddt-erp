import type { IntegrationConnectionStatus } from "./types";

const legalTransitions: Record<IntegrationConnectionStatus, IntegrationConnectionStatus[]> = {
  pending: ["connected", "failed", "disabled", "disconnected"],
  connected: ["degraded", "expired", "disabled", "disconnected", "reconnect_required"],
  degraded: ["connected", "reconnect_required", "disabled", "disconnected", "failed"],
  expired: ["connected", "disconnected", "reconnect_required"],
  reconnect_required: ["pending", "connected", "disabled", "disconnected"],
  failed: ["pending", "connected", "disabled", "disconnected"],
  disabled: ["pending", "connected", "disconnected"],
  disconnected: [],
};

export function canTransitionIntegrationStatus(
  currentStatus: IntegrationConnectionStatus,
  nextStatus: IntegrationConnectionStatus
) {
  return legalTransitions[currentStatus].includes(nextStatus);
}

export function assertIntegrationStatusTransition(
  currentStatus: IntegrationConnectionStatus,
  nextStatus: IntegrationConnectionStatus
) {
  if (!canTransitionIntegrationStatus(currentStatus, nextStatus)) {
    throw new Error(`Illegal integration status transition from ${currentStatus} to ${nextStatus}.`);
  }
}
