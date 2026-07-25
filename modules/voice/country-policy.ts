import type { TenantCountryCode } from "@/modules/countries/policy";
import { getTenantCountryProfile } from "@/modules/countries/policy";
import {
  getApprovedVapiVoice,
  getApprovedVapiVoicesForCountry,
} from "@/modules/voice/vapi/voice-catalog";

export const pakistanLanguageModes = [
  "ENGLISH",
  "URDU",
  "ROMAN_URDU",
  "ROMAN_ENGLISH",
  "MIXED_ROMAN_URDU_ENGLISH",
  "AUTO_DETECT",
] as const;

export const ukLanguageModes = ["ENGLISH"] as const;

export function getAllowedVoiceLanguageModesForCountry(countryCode: TenantCountryCode) {
  return countryCode === "GB" ? [...ukLanguageModes] : [...pakistanLanguageModes];
}

export function validateVoiceLanguageModeForCountry(countryCode: TenantCountryCode, languageMode: string) {
  return getAllowedVoiceLanguageModesForCountry(countryCode).includes(languageMode as any);
}

export function getDefaultVoiceLanguageModeForCountry(countryCode: TenantCountryCode) {
  return getTenantCountryProfile(countryCode).defaultLanguageMode;
}

export function resolveVapiTranscriberLanguage(countryCode: TenantCountryCode, languageMode: string) {
  if (countryCode === "GB") return "en-GB";
  if (languageMode === "URDU") return "ur";
  return "en-PK";
}

export function getVoicePromptSpeechStyle(countryCode: TenantCountryCode, languageMode: string) {
  if (countryCode === "GB") {
    return {
      spokenLanguage: "British English",
      transcriptScript: "Latin",
      responseStyle: "British English with UK conventions",
    };
  }

  if (languageMode === "URDU") {
    return {
      spokenLanguage: "Urdu",
      transcriptScript: "Urdu script",
      responseStyle: "Urdu-first professional conversation",
    };
  }

  if (languageMode === "ROMAN_URDU") {
    return {
      spokenLanguage: "Urdu",
      transcriptScript: "Latin",
      responseStyle: "Roman Urdu",
    };
  }

  if (languageMode === "ROMAN_ENGLISH") {
    return {
      spokenLanguage: "English",
      transcriptScript: "Latin",
      responseStyle: "Roman English with Pakistani phrasing",
    };
  }

  if (languageMode === "MIXED_ROMAN_URDU_ENGLISH") {
    return {
      spokenLanguage: "Mixed Urdu-English",
      transcriptScript: "Latin",
      responseStyle: "Natural Roman Urdu and English code-switching",
    };
  }

  return {
    spokenLanguage: "Mixed Urdu-English",
    transcriptScript: "Latin",
    responseStyle: "Auto-detected Pakistan conversation",
  };
}

export function validateVoiceSelectionForCountry(input: {
  countryCode: TenantCountryCode;
  voiceId: string | null | undefined;
  languageMode: string;
}) {
  if (!validateVoiceLanguageModeForCountry(input.countryCode, input.languageMode)) {
    return {
      valid: false,
      reason: `Language mode ${input.languageMode} is not valid for ${input.countryCode}.`,
    };
  }

  if (!input.voiceId) {
    return {
      valid: false,
      reason:
        input.countryCode === "GB"
          ? "No verified British English voice is currently configured. Please contact support."
          : "No approved Pakistan-compatible voice is currently configured. Please contact support.",
    };
  }

  const voice = getApprovedVapiVoice(input.countryCode, input.voiceId);
  if (!voice) {
    return {
      valid: false,
      reason:
        input.countryCode === "GB"
          ? "The selected voice is not approved for GB."
          : "The selected voice is not approved for PK.",
    };
  }

  if (!voice.supportedLanguageModes.includes(input.languageMode)) {
    return {
      valid: false,
      reason: `Voice ${voice.displayName} does not support the language mode ${input.languageMode}.`,
    };
  }

  return { valid: true as const, voice };
}

export function validateVoiceActivationPolicy(input: {
  countryCode: TenantCountryCode | null;
  branchCountryMatchesTenant: boolean;
  vapiAssistantExists: boolean;
  phoneNumberMappingExists: boolean;
  voiceId: string | null | undefined;
  languageMode: string;
  currency: string | null | undefined;
  timezone: string | null | undefined;
  paymentMethods: string[];
  taxLabel: string | null | undefined;
  businessHoursConfigured: boolean;
  emergencyFallbackConfigured: boolean;
  testCallPassed: boolean;
}) {
  const errors: string[] = [];

  if (!input.countryCode) {
    errors.push("Tenant country is not set.");
    return { valid: false, errors };
  }

  const profile = getTenantCountryProfile(input.countryCode);

  if (!input.branchCountryMatchesTenant) errors.push("Branch country does not match tenant country policy.");
  if (!input.vapiAssistantExists) errors.push("Vapi assistant is missing.");
  if (!input.phoneNumberMappingExists) errors.push("Phone number mapping is missing.");
  if ((input.currency || "").toUpperCase() !== profile.currency) errors.push("Currency is not country-compatible.");
  if ((input.timezone || "").trim() !== profile.timezone) errors.push("Timezone is not country-compatible.");
  if ((input.taxLabel || "").trim() && (input.taxLabel || "").trim() !== profile.taxLabel && input.countryCode === "GB") {
    errors.push("Tax profile is not country-compatible.");
  }

  const paymentMethods = input.paymentMethods.map((value) => value.trim().toLowerCase());
  const ukForbidden = ["jazzcash", "easypaisa", "raast"];
  const pkForbidden = ["debit_card", "credit_card", "payment_link"];
  if (input.countryCode === "GB" && paymentMethods.some((value) => ukForbidden.includes(value))) {
    errors.push("Payment methods are not country-compatible.");
  }
  if (input.countryCode === "PK" && paymentMethods.some((value) => pkForbidden.includes(value))) {
    errors.push("Payment methods are not country-compatible.");
  }

  const voiceValidation = validateVoiceSelectionForCountry({
    countryCode: input.countryCode,
    voiceId: input.voiceId,
    languageMode: input.languageMode,
  });
  if (!voiceValidation.valid) errors.push(voiceValidation.reason);

  if (!input.businessHoursConfigured) errors.push("Business hours are not configured.");
  if (!input.emergencyFallbackConfigured) errors.push("Emergency fallback is not configured.");
  if (!input.testCallPassed) errors.push("Market-specific test call has not passed.");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getVoicePreviewCatalogue(countryCode: TenantCountryCode) {
  return getApprovedVapiVoicesForCountry(countryCode).map((voice) => ({
    voiceId: voice.voiceId,
    displayName: voice.displayName,
    previewUrl: voice.previewUrl,
    locale: voice.locale,
    accent: voice.accent,
  }));
}
