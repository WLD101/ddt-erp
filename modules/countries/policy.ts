import { z } from "zod";

import { getMarketDefaults, type MarketKey } from "@/modules/onboarding/market-profiles";

export const tenantCountryCodeSchema = z.enum(["GB", "PK"]);

export type TenantCountryCode = z.infer<typeof tenantCountryCodeSchema>;

export type TenantCountryProfile = {
  countryCode: TenantCountryCode;
  countryName: "United Kingdom" | "Pakistan";
  marketKey: MarketKey;
  locale: "en-GB" | "en-PK";
  currency: "GBP" | "PKR";
  symbol: "GBP" | "PKR";
  timezone: "Europe/London" | "Asia/Karachi";
  phoneDialCode: "+44" | "+92";
  defaultLanguageMode: "ENGLISH" | "MIXED_ROMAN_URDU_ENGLISH";
  allowedLanguageModes: string[];
  taxLabel: "VAT" | "Sales Tax";
  pricingProfile: string;
  complianceProfile: string;
};

export const TENANT_COUNTRY_PROFILES: Record<TenantCountryCode, TenantCountryProfile> = {
  GB: {
    countryCode: "GB",
    countryName: "United Kingdom",
    marketKey: "uk",
    locale: "en-GB",
    currency: "GBP",
    symbol: "GBP",
    timezone: "Europe/London",
    phoneDialCode: "+44",
    defaultLanguageMode: "ENGLISH",
    allowedLanguageModes: ["ENGLISH"],
    taxLabel: "VAT",
    pricingProfile: "voice_uk_gbp",
    complianceProfile: "uk_standard_voice",
  },
  PK: {
    countryCode: "PK",
    countryName: "Pakistan",
    marketKey: "pk",
    locale: "en-PK",
    currency: "PKR",
    symbol: "PKR",
    timezone: "Asia/Karachi",
    phoneDialCode: "+92",
    defaultLanguageMode: "MIXED_ROMAN_URDU_ENGLISH",
    allowedLanguageModes: ["ENGLISH", "URDU", "ROMAN_URDU", "ROMAN_ENGLISH", "MIXED_ROMAN_URDU_ENGLISH", "AUTO_DETECT"],
    taxLabel: "Sales Tax",
    pricingProfile: "voice_pk_pkr",
    complianceProfile: "pk_standard_voice",
  },
};

export function normalizeTenantCountryCode(value: string | null | undefined): TenantCountryCode | null {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === "GB" || normalized === "UK" || normalized === "UNITED KINGDOM") return "GB";
  if (normalized === "PK" || normalized === "PAKISTAN") return "PK";
  return null;
}

export function getTenantCountryProfile(countryCode: TenantCountryCode) {
  return TENANT_COUNTRY_PROFILES[countryCode];
}

export function getTenantCountryProfileByMarketKey(marketKey: MarketKey) {
  return marketKey === "uk" ? TENANT_COUNTRY_PROFILES.GB : TENANT_COUNTRY_PROFILES.PK;
}

export function resolveExplicitTenantCountry(input: {
  country?: string | null;
  countryCode?: string | null;
  marketKey?: string | null;
}) {
  const direct = normalizeTenantCountryCode(input.countryCode);
  if (direct) return direct;

  const byCountryName = normalizeTenantCountryCode(input.country);
  if (byCountryName) return byCountryName;

  if (input.marketKey === "uk") return "GB";
  if (input.marketKey === "pk") return "PK";

  return null;
}

export function buildCountryDerivedOrganizationPatch(countryCode: TenantCountryCode) {
  const profile = getTenantCountryProfile(countryCode);
  const defaults = getMarketDefaults(profile.marketKey);
  return {
    country: profile.countryName,
    countryCode: profile.countryCode,
    marketKey: profile.marketKey,
    currency: profile.currency,
    locale: profile.locale,
    timezone: profile.timezone,
    taxLabel: profile.taxLabel,
    pricingProfile: defaults.pricingProfile,
    complianceProfile: defaults.complianceProfile,
    marketRequiresReview: false,
  };
}

export function validateCountryChangeSafety(input: {
  existingCountryCode?: string | null;
  nextCountryCode: TenantCountryCode;
  activatedAt?: Date | null;
}) {
  const existingCountryCode = normalizeTenantCountryCode(input.existingCountryCode);
  if (!existingCountryCode) return { allowed: true as const };
  if (existingCountryCode === input.nextCountryCode) return { allowed: true as const };

  return {
    allowed: false as const,
    reason:
      input.activatedAt
        ? "Country change requires a controlled migration flow and cannot be applied directly to an activated tenant."
        : "Country change requires a controlled migration flow and explicit revalidation.",
  };
}
