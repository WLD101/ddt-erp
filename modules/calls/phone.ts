import type { CountryCode } from "libphonenumber-js";
import type { MetadataJson } from "libphonenumber-js/core";

import * as phoneCore from "libphonenumber-js/core";
import _metadataModule from "libphonenumber-js/metadata.max.json";

const metadataModule = _metadataModule as unknown as
  | MetadataJson
  | { default: MetadataJson };
const phoneMetadata = ("default" in metadataModule ? metadataModule.default : metadataModule) as MetadataJson;

export type SupportedCallingCountry = "PK" | "US" | "GB";

export type NormalizedPhoneNumber = {
  input: string;
  e164: string;
  countryCode: string | null;
  callingCode: string;
  nationalNumber: string;
  isValid: boolean;
  numberType?: string | null;
};

export type CountryDetection = {
  isoCode: SupportedCallingCountry;
  countryName: string;
  dialCode: string;
  reason: string;
};

const SUPPORTED_COUNTRIES = new Set<SupportedCallingCountry>(["PK", "US", "GB"]);

const COUNTRY_NAMES: Record<SupportedCallingCountry, string> = {
  PK: "Pakistan",
  US: "United States",
  GB: "United Kingdom",
};

const COUNTRY_DIAL_CODES: Record<SupportedCallingCountry, string> = {
  PK: "+92",
  US: "+1",
  GB: "+44",
};

export class PhoneNumberError extends Error {
  constructor(
    readonly code: "INVALID_PHONE_NUMBER" | "AMBIGUOUS_PHONE_NUMBER" | "UNSUPPORTED_COUNTRY",
    message: string
  ) {
    super(message);
    this.name = "PhoneNumberError";
  }
}

export function normalizePhoneNumber(input: string, defaultCountry?: string | null): NormalizedPhoneNumber {
  const raw = input.trim();
  if (!raw) {
    throw new PhoneNumberError("INVALID_PHONE_NUMBER", "Phone number is required.");
  }

  const country = normalizeCountryCode(defaultCountry);
  const hasInternationalPrefix = raw.startsWith("+") || raw.replace(/\D/g, "").startsWith("00");
  if (!hasInternationalPrefix && !country) {
    throw new PhoneNumberError("AMBIGUOUS_PHONE_NUMBER", "Local phone numbers require a tenant default country.");
  }

  const normalizedInput = raw.replace(/^00/, "+");
  const parsed = country
    ? phoneCore.parsePhoneNumberFromString(normalizedInput, { defaultCountry: country }, phoneMetadata)
    : phoneCore.parsePhoneNumberFromString(normalizedInput, phoneMetadata);
  if (!parsed || !parsed.isValid()) {
    throw new PhoneNumberError("INVALID_PHONE_NUMBER", "Phone number is not valid.");
  }

  const parsedCountry = parsed.country || null;
  if (!isSupportedCountry(parsedCountry)) {
    throw new PhoneNumberError(
      "UNSUPPORTED_COUNTRY",
      parsedCountry
        ? `${parsedCountry} is not enabled for WhatsQuery calling yet.`
        : "This destination country is not enabled for WhatsQuery calling yet."
    );
  }

  return {
    input: raw,
    e164: parsed.number,
    countryCode: parsedCountry,
    callingCode: parsed.countryCallingCode,
    nationalNumber: parsed.nationalNumber,
    isValid: true,
    numberType: parsed.getType() || null,
  };
}

export function normalizeToE164(input: string, selectedCountry?: string | null) {
  return normalizePhoneNumber(input, selectedCountry).e164;
}

export function normalizeCountryCode(value?: string | null): SupportedCallingCountry | null {
  const normalized = (value || "").trim().toUpperCase();
  if (["PK", "PAKISTAN", "+92", "92"].includes(normalized)) return "PK";
  if (["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA", "+1", "1"].includes(normalized)) return "US";
  if (["GB", "UK", "UNITED KINGDOM", "GREAT BRITAIN", "+44", "44"].includes(normalized)) return "GB";
  return null;
}

export function detectCallingCountry(e164Number: string, selectedCountry?: string | null): CountryDetection {
  const normalized = normalizePhoneNumber(e164Number, selectedCountry);
  const isoCode = normalized.countryCode as SupportedCallingCountry;
  return detection(isoCode, `validated_country_${isoCode}`);
}

export function isBlockedDestination(e164Number: string) {
  const configured = (process.env.VOICE_BLOCKED_DESTINATIONS || "")
    .split(",")
    .map((prefix) => prefix.trim())
    .filter(Boolean);

  const defaultBlockedPrefixes = ["+979"];
  return [...defaultBlockedPrefixes, ...configured].some((prefix) => e164Number.startsWith(prefix));
}

export function getDialCode(countryCode: SupportedCallingCountry) {
  return `+${phoneCore.getCountryCallingCode(countryCode, phoneMetadata)}`;
}

function detection(isoCode: SupportedCallingCountry, reason: string): CountryDetection {
  return {
    isoCode,
    countryName: COUNTRY_NAMES[isoCode],
    dialCode: COUNTRY_DIAL_CODES[isoCode],
    reason,
  };
}

function isSupportedCountry(value: string | null): value is SupportedCallingCountry {
  return !!value && SUPPORTED_COUNTRIES.has(value as SupportedCallingCountry);
}

export function toLibPhoneCountryCode(value: SupportedCallingCountry): CountryCode {
  return value;
}
