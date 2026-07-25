import { requiresStaffApproval, type VoiceErpAutomationConfig } from "./automation-config";

export type VoiceOrderConversionReadiness =
  | { status: "needs_staff_review"; reason: string }
  | { status: "needs_information"; reason: string }
  | { status: "ready_for_conversion" };

export function assessVoiceOrderConversion(input: {
  automation: VoiceErpAutomationConfig;
  orderDetailsText: string;
  confirmedCatalogItems: Array<{ productId: string; quantity: number }> | null;
  approvalGranted: boolean;
}) : VoiceOrderConversionReadiness {
  if (!input.orderDetailsText.trim()) {
    return { status: "needs_information", reason: "Order details are missing." };
  }

  if (!input.confirmedCatalogItems || input.confirmedCatalogItems.length === 0) {
    return {
      status: "needs_information",
      reason: "Confirmed tenant-owned catalog items are required before ERP order conversion.",
    };
  }

  if (requiresStaffApproval(input.automation.voiceOrderAutomationEnabled, input.automation.voiceOrderAutomationMode)) {
    return input.approvalGranted
      ? { status: "ready_for_conversion" }
      : { status: "needs_staff_review", reason: "Order automation is not allowed without review or approval." };
  }

  return { status: "ready_for_conversion" };
}
