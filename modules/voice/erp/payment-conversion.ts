import { normalizePaymentMethodForMarket } from "@/modules/markets/tenant-market";
import type { MarketKey } from "@/modules/onboarding/market-profiles";
import type { VoiceErpAutomationConfig } from "./automation-config";

export function assessVoicePaymentConversion(input: {
  automation: VoiceErpAutomationConfig;
  marketKey: MarketKey;
  paymentMethod: string | null;
  paymentConfirmed: boolean;
}) {
  if (!input.automation.voicePaymentAutomationEnabled) {
    return { status: "needs_staff_review" as const, reason: "Payment automation is disabled for this tenant." };
  }

  const normalizedMethod = normalizePaymentMethodForMarket(input.paymentMethod, input.marketKey);
  if (!normalizedMethod) {
    return { status: "needs_information" as const, reason: "A configured tenant payment method is required." };
  }

  if (!input.paymentConfirmed) {
    return { status: "needs_staff_review" as const, reason: "Payment cannot be recorded until settlement is explicitly confirmed." };
  }

  return { status: "ready_for_conversion" as const, paymentMethod: normalizedMethod };
}
