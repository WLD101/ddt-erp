import assert from "node:assert/strict";
import test from "node:test";

import {
  assertJournalCurrencyMatchesMarket,
  assertRequestedMarketMatchesTenant,
  normalizePaymentMethodForMarket,
  resolveTenantMarketContextFromOrganization,
} from "@/modules/markets/tenant-market";
import { normalizeVoicePhone } from "@/modules/voice/erp/customer-resolution";
import { parseVoiceErpAutomationConfig } from "@/modules/voice/erp/automation-config";
import { assessVoicePaymentConversion } from "@/modules/voice/erp/payment-conversion";
import {
  buildBusinessSpecificReceptionistPrompt,
  buildVoiceAssistantFirstMessage,
} from "@/modules/voice/training/prompt-builder";

test("UK tenant receives UK-only market configuration", () => {
  const context = resolveTenantMarketContextFromOrganization({
    id: "org-uk",
    marketKey: "uk",
    marketRequiresReview: false,
    country: "United Kingdom",
    currency: "GBP",
    locale: "en-GB",
    timezone: "Europe/London",
    countryCode: "+44",
    taxLabel: "VAT",
    pricingProfile: "voice_uk_gbp",
    complianceProfile: "uk_standard_voice",
  });

  assert.equal(context.status, "resolved");
  if (context.status === "resolved") {
    assert.equal(context.currency, "GBP");
    assert.equal(context.taxLabel, "VAT");
    assert.equal(context.paymentMethods.includes("jazzcash"), false);
    assert.equal(context.paymentMethods.includes("debit_card"), true);
    assert.equal(context.documentLabels.invoice, "VAT invoice");
    assert.equal(context.reportLabels.taxSummary, "VAT summary");
  }
});

test("Pakistan tenant receives Pakistan-only market configuration", () => {
  const context = resolveTenantMarketContextFromOrganization({
    id: "org-pk",
    marketKey: "pk",
    marketRequiresReview: false,
    country: "Pakistan",
    currency: "PKR",
    locale: "en-PK",
    timezone: "Asia/Karachi",
    countryCode: "+92",
    taxLabel: "Sales Tax",
    pricingProfile: "voice_pk_pkr",
    complianceProfile: "pk_standard_voice",
  });

  assert.equal(context.status, "resolved");
  if (context.status === "resolved") {
    assert.equal(context.currency, "PKR");
    assert.equal(context.taxLabel, "Sales Tax");
    assert.equal(context.paymentMethods.includes("easypaisa"), true);
    assert.equal(context.paymentMethods.includes("credit_card"), false);
    assert.equal(context.documentLabels.invoice, "Sales invoice");
    assert.equal(context.reportLabels.taxSummary, "Sales-tax summary");
  }
});

test("tenants without an explicit valid market stay in review state", () => {
  const context = resolveTenantMarketContextFromOrganization({
    id: "org-review",
    marketKey: null,
    marketRequiresReview: true,
    currency: "PKR",
  });

  assert.equal(context.status, "review_required");
});

test("cross-market currency mismatches are rejected", () => {
  const context = resolveTenantMarketContextFromOrganization({
    id: "org-bad",
    marketKey: "uk",
    marketRequiresReview: false,
    currency: "PKR",
    locale: "en-GB",
    timezone: "Europe/London",
    countryCode: "+44",
  });

  assert.equal(context.status, "review_required");
});

test("phone normalization respects tenant market defaults", () => {
  assert.equal(normalizeVoicePhone("+44 20 7946 0018", "uk"), "+442079460018");
  assert.equal(normalizeVoicePhone("0300 1234567", "pk"), "+923001234567");
});

test("payment methods are isolated by market", () => {
  assert.equal(normalizePaymentMethodForMarket("JazzCash", "uk"), null);
  assert.equal(normalizePaymentMethodForMarket("Stripe", "pk"), null);
  assert.equal(normalizePaymentMethodForMarket("Debit card", "uk"), "debit_card");
  assert.equal(normalizePaymentMethodForMarket("JazzCash", "pk"), "jazzcash");
});

test("voice prompts use the correct market language and terminology", () => {
  const ukPrompt = buildBusinessSpecificReceptionistPrompt({
    businessIdentity: {
      businessName: "Starlight Dental",
      industry: "Dental practice",
      primaryLanguage: "ENGLISH",
      supportedLanguages: ["ENGLISH"],
      tone: "PROFESSIONAL",
    },
    marketContext: {
      marketKey: "uk",
      marketName: "United Kingdom",
      currency: "GBP",
      locale: "en-GB",
      timezone: "Europe/London",
      taxLabel: "VAT",
      paymentMethods: ["cash", "debit_card", "credit_card", "bank_transfer", "stripe", "payment_link"],
      documentLabels: {
        invoice: "VAT invoice",
        receipt: "Receipt",
        amountPaid: "Amount paid",
        balanceDue: "Balance due",
        taxBreakdown: "VAT breakdown",
      },
    },
    agent: {
      id: null,
      name: "Main Receptionist",
      role: "AI_RECEPTIONIST",
      languageMode: "AUTO_DETECT",
      supportedLanguages: ["ENGLISH"],
      tone: "PROFESSIONAL",
      allowedTools: ["lookup_faq"],
      isDefault: true,
      isActive: true,
    },
    services: [],
    knowledgeBase: [],
    bookingRules: {
      acceptsBookings: false,
      bookingType: "APPOINTMENT",
      bookingMode: "REQUEST_ONLY",
      requiredFields: [],
    },
    orderRules: {
      acceptsOrderRequests: false,
      orderMode: "REQUEST_ONLY",
      orderTypes: [],
      requiredFields: [],
    },
    handoffRules: {
      handoffTriggers: ["UNKNOWN_ANSWER"],
    },
    actionPolicy: {
      allowedActions: ["ANSWER_FAQS"],
      blockedActions: ["TAKE_PAYMENTS"],
      erpWritesEnabled: false,
      backendAutoConfirmationEnabled: false,
    },
  });

  const pkPrompt = buildBusinessSpecificReceptionistPrompt({
    businessIdentity: {
      businessName: "Karachi Foods",
      industry: "Restaurant",
      primaryLanguage: "AUTO_DETECT",
      supportedLanguages: ["ENGLISH", "URDU"],
      tone: "PROFESSIONAL",
    },
    marketContext: {
      marketKey: "pk",
      marketName: "Pakistan",
      currency: "PKR",
      locale: "en-PK",
      timezone: "Asia/Karachi",
      taxLabel: "Sales Tax",
      paymentMethods: ["cash", "bank_transfer", "card", "jazzcash", "easypaisa", "raast"],
      documentLabels: {
        invoice: "Sales invoice",
        receipt: "Receipt",
        amountPaid: "Amount paid",
        balanceDue: "Balance due",
        taxBreakdown: "Sales-tax breakdown",
      },
    },
    agent: {
      id: null,
      name: "Main Receptionist",
      role: "AI_RECEPTIONIST",
      languageMode: "AUTO_DETECT",
      supportedLanguages: ["ENGLISH", "URDU"],
      tone: "PROFESSIONAL",
      allowedTools: ["lookup_faq"],
      isDefault: true,
      isActive: true,
    },
    services: [],
    knowledgeBase: [],
    bookingRules: {
      acceptsBookings: false,
      bookingType: "APPOINTMENT",
      bookingMode: "REQUEST_ONLY",
      requiredFields: [],
    },
    orderRules: {
      acceptsOrderRequests: false,
      orderMode: "REQUEST_ONLY",
      orderTypes: [],
      requiredFields: [],
    },
    handoffRules: {
      handoffTriggers: ["UNKNOWN_ANSWER"],
    },
    actionPolicy: {
      allowedActions: ["ANSWER_FAQS"],
      blockedActions: ["TAKE_PAYMENTS"],
      erpWritesEnabled: false,
      backendAutoConfirmationEnabled: false,
    },
  });

  assert.match(ukPrompt, /VAT/i);
  assert.match(ukPrompt, /Never mention JazzCash, Easypaisa, Raast, FBR, NTN, or STRN/i);
  assert.match(pkPrompt, /JazzCash|Easypaisa|PKR|Sales Tax/i);
  assert.match(pkPrompt, /Never mention UK VAT numbers or UK company-number language/i);
});

test("first message changes by market", () => {
  const ukGreeting = buildVoiceAssistantFirstMessage({
    businessIdentity: {
      businessName: "Starlight Dental",
      industry: "Dental practice",
      primaryLanguage: "ENGLISH",
      supportedLanguages: ["ENGLISH"],
      tone: "PROFESSIONAL",
    },
    marketContext: {
      marketKey: "uk",
      marketName: "United Kingdom",
      currency: "GBP",
      locale: "en-GB",
      timezone: "Europe/London",
      taxLabel: "VAT",
      paymentMethods: ["cash"],
      documentLabels: {
        invoice: "VAT invoice",
        receipt: "Receipt",
        amountPaid: "Amount paid",
        balanceDue: "Balance due",
        taxBreakdown: "VAT breakdown",
      },
    },
    agent: {
      id: null,
      name: "Receptionist",
      role: "AI_RECEPTIONIST",
      languageMode: "AUTO_DETECT",
      supportedLanguages: ["ENGLISH"],
      tone: "PROFESSIONAL",
      allowedTools: [],
      isDefault: true,
      isActive: true,
    },
    services: [],
    knowledgeBase: [],
    bookingRules: { acceptsBookings: false, bookingType: "APPOINTMENT", bookingMode: "REQUEST_ONLY", requiredFields: [] },
    orderRules: { acceptsOrderRequests: false, orderMode: "REQUEST_ONLY", orderTypes: [], requiredFields: [] },
    handoffRules: { handoffTriggers: [] },
    actionPolicy: { allowedActions: [], blockedActions: [], erpWritesEnabled: false, backendAutoConfirmationEnabled: false },
  });

  const pkGreeting = buildVoiceAssistantFirstMessage({
    businessIdentity: {
      businessName: "Karachi Foods",
      industry: "Restaurant",
      primaryLanguage: "AUTO_DETECT",
      supportedLanguages: ["ENGLISH", "URDU"],
      tone: "PROFESSIONAL",
    },
    marketContext: {
      marketKey: "pk",
      marketName: "Pakistan",
      currency: "PKR",
      locale: "en-PK",
      timezone: "Asia/Karachi",
      taxLabel: "Sales Tax",
      paymentMethods: ["cash"],
      documentLabels: {
        invoice: "Sales invoice",
        receipt: "Receipt",
        amountPaid: "Amount paid",
        balanceDue: "Balance due",
        taxBreakdown: "Sales-tax breakdown",
      },
    },
    agent: {
      id: null,
      name: "Receptionist",
      role: "AI_RECEPTIONIST",
      languageMode: "AUTO_DETECT",
      supportedLanguages: ["ENGLISH", "URDU"],
      tone: "PROFESSIONAL",
      allowedTools: [],
      isDefault: true,
      isActive: true,
    },
    services: [],
    knowledgeBase: [],
    bookingRules: { acceptsBookings: false, bookingType: "APPOINTMENT", bookingMode: "REQUEST_ONLY", requiredFields: [] },
    orderRules: { acceptsOrderRequests: false, orderMode: "REQUEST_ONLY", orderTypes: [], requiredFields: [] },
    handoffRules: { handoffTriggers: [] },
    actionPolicy: { allowedActions: [], blockedActions: [], erpWritesEnabled: false, backendAutoConfirmationEnabled: false },
  });

  assert.match(ukGreeting, /^Thanks for calling/);
  assert.match(pkGreeting, /^Assalam-o-Alaikum/);
});

test("tenant market cannot be overridden by Vapi tool arguments", () => {
  const context = resolveTenantMarketContextFromOrganization({
    id: "org-uk",
    marketKey: "uk",
    marketRequiresReview: false,
    currency: "GBP",
    locale: "en-GB",
    timezone: "Europe/London",
    countryCode: "+44",
  });

  assert.equal(context.status, "resolved");
  if (context.status === "resolved") {
    assert.throws(() => assertRequestedMarketMatchesTenant(context, "pk"));
  }
});

test("market-specific payment conversion rejects cross-market methods", () => {
  const automation = parseVoiceErpAutomationConfig(JSON.stringify({
    voicePaymentAutomationEnabled: true,
    voicePaymentAutomationMode: "after_caller_confirmation",
  }));

  const uk = assessVoicePaymentConversion({
    automation,
    marketKey: "uk",
    paymentMethod: "JazzCash",
    paymentConfirmed: true,
  });
  const pk = assessVoicePaymentConversion({
    automation,
    marketKey: "pk",
    paymentMethod: "Stripe",
    paymentConfirmed: true,
  });

  assert.equal(uk.status, "needs_information");
  assert.equal(pk.status, "needs_information");
});

test("mixed-currency journal entries are rejected", () => {
  assert.throws(() =>
    assertJournalCurrencyMatchesMarket({
      marketKey: "uk",
      currency: "GBP",
      entryCurrencies: ["GBP", "PKR"],
    }),
  );
});
