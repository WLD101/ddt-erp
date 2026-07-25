import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCountryDerivedOrganizationPatch,
  normalizeTenantCountryCode,
  resolveExplicitTenantCountry,
  validateCountryChangeSafety,
} from "@/modules/countries/policy";
import {
  getDefaultVoiceLanguageModeForCountry,
  getVoicePreviewCatalogue,
  validateVoiceActivationPolicy,
  validateVoiceLanguageModeForCountry,
  validateVoiceSelectionForCountry,
} from "@/modules/voice/country-policy";
import {
  getApprovedVapiVoice,
  getApprovedVapiVoicesForCountry,
} from "@/modules/voice/vapi/voice-catalog";

test("country selection normalizes only supported countries", () => {
  assert.equal(normalizeTenantCountryCode("uk"), "GB");
  assert.equal(normalizeTenantCountryCode("Pakistan"), "PK");
  assert.equal(normalizeTenantCountryCode("US"), null);
});

test("tenant country resolution relies on explicit fields only", () => {
  assert.equal(resolveExplicitTenantCountry({ countryCode: "GB" }), "GB");
  assert.equal(resolveExplicitTenantCountry({ country: "Pakistan" }), "PK");
  assert.equal(resolveExplicitTenantCountry({ marketKey: "uk" }), "GB");
  assert.equal(resolveExplicitTenantCountry({}), null);
});

test("country patch derives UK market profile", () => {
  const patch = buildCountryDerivedOrganizationPatch("GB");
  assert.equal(patch.country, "United Kingdom");
  assert.equal(patch.countryCode, "GB");
  assert.equal(patch.marketKey, "uk");
  assert.equal(patch.currency, "GBP");
  assert.equal(patch.timezone, "Europe/London");
  assert.equal(patch.taxLabel, "VAT");
});

test("country patch derives Pakistan market profile", () => {
  const patch = buildCountryDerivedOrganizationPatch("PK");
  assert.equal(patch.country, "Pakistan");
  assert.equal(patch.countryCode, "PK");
  assert.equal(patch.marketKey, "pk");
  assert.equal(patch.currency, "PKR");
  assert.equal(patch.timezone, "Asia/Karachi");
  assert.equal(patch.taxLabel, "Sales Tax");
});

test("UK tenants only receive approved British voices", () => {
  const voices = getApprovedVapiVoicesForCountry("GB");
  assert.ok(voices.length >= 1);
  assert.ok(voices.every((voice) => voice.locale === "en-GB"));
  assert.ok(voices.every((voice) => voice.accent === "British"));
});

test("UK rejects non-British voices", () => {
  const pkVoice = getApprovedVapiVoicesForCountry("PK")[0];
  const result = validateVoiceSelectionForCountry({
    countryCode: "GB",
    voiceId: pkVoice.voiceId,
    languageMode: "ENGLISH",
  });
  assert.equal(result.valid, false);
});

test("Pakistan supports Roman Urdu, Roman English, and mixed mode", () => {
  assert.equal(validateVoiceLanguageModeForCountry("PK", "ROMAN_URDU"), true);
  assert.equal(validateVoiceLanguageModeForCountry("PK", "ROMAN_ENGLISH"), true);
  assert.equal(validateVoiceLanguageModeForCountry("PK", "MIXED_ROMAN_URDU_ENGLISH"), true);
  assert.equal(getDefaultVoiceLanguageModeForCountry("PK"), "MIXED_ROMAN_URDU_ENGLISH");
});

test("UK only supports English mode", () => {
  assert.equal(validateVoiceLanguageModeForCountry("GB", "ENGLISH"), true);
  assert.equal(validateVoiceLanguageModeForCountry("GB", "URDU"), false);
});

test("country change safety blocks direct activated tenant changes", () => {
  const result = validateCountryChangeSafety({
    existingCountryCode: "GB",
    nextCountryCode: "PK",
    activatedAt: new Date("2026-07-25T10:00:00.000Z"),
  });
  assert.equal(result.allowed, false);
});

test("UK activation fails without a verified British voice", () => {
  const result = validateVoiceActivationPolicy({
    countryCode: "GB",
    branchCountryMatchesTenant: true,
    vapiAssistantExists: true,
    phoneNumberMappingExists: true,
    voiceId: null,
    languageMode: "ENGLISH",
    currency: "GBP",
    timezone: "Europe/London",
    paymentMethods: ["cash", "bank_transfer"],
    taxLabel: "VAT",
    businessHoursConfigured: true,
    emergencyFallbackConfigured: true,
    testCallPassed: true,
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /British English voice/i);
});

test("Pakistan activation rejects UK-only payment mix", () => {
  const pkVoice = getApprovedVapiVoicesForCountry("PK")[0];
  const result = validateVoiceActivationPolicy({
    countryCode: "PK",
    branchCountryMatchesTenant: true,
    vapiAssistantExists: true,
    phoneNumberMappingExists: true,
    voiceId: pkVoice.voiceId,
    languageMode: "MIXED_ROMAN_URDU_ENGLISH",
    currency: "PKR",
    timezone: "Asia/Karachi",
    paymentMethods: ["debit_card", "cash"],
    taxLabel: "Sales Tax",
    businessHoursConfigured: true,
    emergencyFallbackConfigured: true,
    testCallPassed: true,
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /Payment methods are not country-compatible/i);
});

test("preview catalogue stays country-scoped", () => {
  const ukPreviews = getVoicePreviewCatalogue("GB");
  const pkPreviews = getVoicePreviewCatalogue("PK");
  assert.ok(ukPreviews.every((voice) => voice.locale === "en-GB"));
  assert.ok(pkPreviews.every((voice) => voice.locale === "en-PK"));
});

test("approved voice lookup remains country-isolated", () => {
  const ukVoice = getApprovedVapiVoicesForCountry("GB")[0];
  assert.ok(getApprovedVapiVoice("GB", ukVoice.voiceId));
  assert.equal(getApprovedVapiVoice("PK", ukVoice.voiceId), null);
});
