import { requiresStaffApproval, type VoiceErpAutomationConfig } from "./automation-config";

export type VoiceBookingConversionReadiness =
  | { status: "needs_staff_review"; reason: string }
  | { status: "needs_information"; reason: string }
  | { status: "ready_for_conversion" };

export function assessVoiceBookingConversion(input: {
  automation: VoiceErpAutomationConfig;
  requestedTime: Date | null;
  customerName: string | null;
  approvalGranted: boolean;
}) : VoiceBookingConversionReadiness {
  if (!input.customerName?.trim()) {
    return { status: "needs_information", reason: "Customer name is required for booking conversion." };
  }

  if (!input.requestedTime) {
    return { status: "needs_information", reason: "A normalized requested time is required for booking conversion." };
  }

  if (requiresStaffApproval(input.automation.voiceBookingAutomationEnabled, input.automation.voiceBookingAutomationMode)) {
    return input.approvalGranted
      ? { status: "ready_for_conversion" }
      : { status: "needs_staff_review", reason: "Booking automation is not allowed without review or approval." };
  }

  return { status: "ready_for_conversion" };
}
