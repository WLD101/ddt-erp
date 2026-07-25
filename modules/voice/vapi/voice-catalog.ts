import type { TenantCountryCode } from "@/modules/countries/policy";

export type ApprovedVapiVoice = {
  provider: "cartesia";
  voiceId: string;
  displayName: string;
  language: string;
  locale: string;
  accent: string;
  presentation?: string | null;
  verificationStatus: "verified";
  lastVerifiedDate: string;
  state: "active" | "deprecated";
  previewUrl?: string | null;
  supportedLanguageModes: string[];
};

const VOICE_CATALOG: Record<TenantCountryCode, ApprovedVapiVoice[]> = {
  GB: [
    {
      provider: "cartesia",
      voiceId: "79a125e8-cd45-4c13-8a67-188112f4dd22",
      displayName: "British Professional F1",
      language: "English",
      locale: "en-GB",
      accent: "British",
      presentation: "neutral",
      verificationStatus: "verified",
      lastVerifiedDate: "2026-07-25",
      state: "active",
      previewUrl: null,
      supportedLanguageModes: ["ENGLISH"],
    },
    {
      provider: "cartesia",
      voiceId: "b7d50908-b17c-442d-ad8d-810c63997ed9",
      displayName: "British Warm F2",
      language: "English",
      locale: "en-GB",
      accent: "British",
      presentation: "warm",
      verificationStatus: "verified",
      lastVerifiedDate: "2026-07-25",
      state: "active",
      previewUrl: null,
      supportedLanguageModes: ["ENGLISH"],
    },
  ],
  PK: [
    {
      provider: "cartesia",
      voiceId: "95856005-0332-41b0-935f-352e296aa0df",
      displayName: "Pakistan English Service F1",
      language: "English",
      locale: "en-PK",
      accent: "Pakistani English",
      presentation: "neutral",
      verificationStatus: "verified",
      lastVerifiedDate: "2026-07-25",
      state: "active",
      previewUrl: null,
      supportedLanguageModes: ["ENGLISH", "ROMAN_ENGLISH", "ROMAN_URDU", "MIXED_ROMAN_URDU_ENGLISH", "AUTO_DETECT"],
    },
    {
      provider: "cartesia",
      voiceId: "846d6cb0-2301-48b6-9683-48f5618ea2f6",
      displayName: "Pakistan Mixed Mode M1",
      language: "English",
      locale: "en-PK",
      accent: "Pakistani English",
      presentation: "mixed",
      verificationStatus: "verified",
      lastVerifiedDate: "2026-07-25",
      state: "active",
      previewUrl: null,
      supportedLanguageModes: ["ENGLISH", "URDU", "ROMAN_URDU", "ROMAN_ENGLISH", "MIXED_ROMAN_URDU_ENGLISH", "AUTO_DETECT"],
    },
  ],
};

export function getApprovedVapiVoicesForCountry(countryCode: TenantCountryCode) {
  return VOICE_CATALOG[countryCode].filter((voice) => voice.state === "active");
}

export function getApprovedVapiVoice(countryCode: TenantCountryCode, voiceId: string | null | undefined) {
  if (!voiceId) return null;
  return getApprovedVapiVoicesForCountry(countryCode).find((voice) => voice.voiceId === voiceId) ?? null;
}

export function getDefaultApprovedVapiVoiceForCountry(countryCode: TenantCountryCode) {
  return getApprovedVapiVoicesForCountry(countryCode)[0] ?? null;
}

export function isApprovedVapiVoiceForCountry(countryCode: TenantCountryCode, voiceId: string | null | undefined) {
  return getApprovedVapiVoice(countryCode, voiceId) !== null;
}
