import { prisma } from "@/lib/prisma";

export type VoiceAutomationMode =
  | "disabled"
  | "review_only"
  | "staff_approval_required"
  | "after_caller_confirmation";

export type VoiceErpAutomationConfig = {
  voiceLeadAutomationEnabled: boolean;
  voiceLeadAutomationMode: VoiceAutomationMode;
  voiceBookingAutomationEnabled: boolean;
  voiceBookingAutomationMode: VoiceAutomationMode;
  voiceOrderAutomationEnabled: boolean;
  voiceOrderAutomationMode: VoiceAutomationMode;
  voiceInvoiceAutomationEnabled: boolean;
  voiceInvoiceAutomationMode: VoiceAutomationMode;
  voicePaymentAutomationEnabled: boolean;
  voicePaymentAutomationMode: VoiceAutomationMode;
  voiceAccountingAutomationEnabled: boolean;
  voiceAccountingAutomationMode: VoiceAutomationMode;
};

const DEFAULT_AUTOMATION_CONFIG: VoiceErpAutomationConfig = {
  voiceLeadAutomationEnabled: false,
  voiceLeadAutomationMode: "review_only",
  voiceBookingAutomationEnabled: false,
  voiceBookingAutomationMode: "review_only",
  voiceOrderAutomationEnabled: false,
  voiceOrderAutomationMode: "review_only",
  voiceInvoiceAutomationEnabled: false,
  voiceInvoiceAutomationMode: "disabled",
  voicePaymentAutomationEnabled: false,
  voicePaymentAutomationMode: "disabled",
  voiceAccountingAutomationEnabled: false,
  voiceAccountingAutomationMode: "disabled",
};

function isMode(value: unknown): value is VoiceAutomationMode {
  return (
    value === "disabled" ||
    value === "review_only" ||
    value === "staff_approval_required" ||
    value === "after_caller_confirmation"
  );
}

export function parseVoiceErpAutomationConfig(input: string | null | undefined): VoiceErpAutomationConfig {
  if (!input) return DEFAULT_AUTOMATION_CONFIG;

  try {
    const parsed = JSON.parse(input) as Partial<VoiceErpAutomationConfig>;
    return {
      voiceLeadAutomationEnabled: parsed.voiceLeadAutomationEnabled === true,
      voiceLeadAutomationMode: isMode(parsed.voiceLeadAutomationMode)
        ? parsed.voiceLeadAutomationMode
        : DEFAULT_AUTOMATION_CONFIG.voiceLeadAutomationMode,
      voiceBookingAutomationEnabled: parsed.voiceBookingAutomationEnabled === true,
      voiceBookingAutomationMode: isMode(parsed.voiceBookingAutomationMode)
        ? parsed.voiceBookingAutomationMode
        : DEFAULT_AUTOMATION_CONFIG.voiceBookingAutomationMode,
      voiceOrderAutomationEnabled: parsed.voiceOrderAutomationEnabled === true,
      voiceOrderAutomationMode: isMode(parsed.voiceOrderAutomationMode)
        ? parsed.voiceOrderAutomationMode
        : DEFAULT_AUTOMATION_CONFIG.voiceOrderAutomationMode,
      voiceInvoiceAutomationEnabled: parsed.voiceInvoiceAutomationEnabled === true,
      voiceInvoiceAutomationMode: isMode(parsed.voiceInvoiceAutomationMode)
        ? parsed.voiceInvoiceAutomationMode
        : DEFAULT_AUTOMATION_CONFIG.voiceInvoiceAutomationMode,
      voicePaymentAutomationEnabled: parsed.voicePaymentAutomationEnabled === true,
      voicePaymentAutomationMode: isMode(parsed.voicePaymentAutomationMode)
        ? parsed.voicePaymentAutomationMode
        : DEFAULT_AUTOMATION_CONFIG.voicePaymentAutomationMode,
      voiceAccountingAutomationEnabled: parsed.voiceAccountingAutomationEnabled === true,
      voiceAccountingAutomationMode: isMode(parsed.voiceAccountingAutomationMode)
        ? parsed.voiceAccountingAutomationMode
        : DEFAULT_AUTOMATION_CONFIG.voiceAccountingAutomationMode,
    };
  } catch {
    return DEFAULT_AUTOMATION_CONFIG;
  }
}

export async function getVoiceErpAutomationConfig(organizationId: string) {
  const settings = await prisma.voiceIntegrationSettings.findUnique({
    where: { organizationId },
    select: { providerConfigNotes: true },
  });

  return parseVoiceErpAutomationConfig(settings?.providerConfigNotes);
}

export function requiresStaffApproval(enabled: boolean, mode: VoiceAutomationMode) {
  if (!enabled) return true;
  return mode === "review_only" || mode === "staff_approval_required" || mode === "disabled";
}
