import assert from "node:assert/strict";
import test from "node:test";

import { resolveTenantMarketContextFromOrganization, assertRequestedMarketMatchesTenant } from "@/modules/markets/tenant-market";
import { normalizeVoicePhone } from "@/modules/voice/erp/customer-resolution";
import { buildVoiceErpIdempotencyKey } from "@/modules/voice/erp/outcome-links";
import { buildApprovedVoiceOrderDraft, deriveInitialVoiceReviewStatus, voiceReviewTransitionMap } from "@/modules/voice/review/workflow";
import { getApprovedVapiVoicesForCountry } from "@/modules/voice/vapi/voice-catalog";

const tenants = [
  {
    label: "UK restaurant",
    organization: {
      id: "uk-restaurant",
      marketKey: "uk",
      marketRequiresReview: false,
      country: "United Kingdom",
      countryCode: "GB",
      currency: "GBP",
      locale: "en-GB",
      timezone: "Europe/London",
      taxLabel: "VAT",
      pricingProfile: "voice_uk_gbp",
      complianceProfile: "uk_standard_voice",
    },
    branchId: "branch-uk-1",
    phone: "020 7946 0018",
    sourceType: "VoiceOrderRequest" as const,
  },
  {
    label: "UK service business",
    organization: {
      id: "uk-service",
      marketKey: "uk",
      marketRequiresReview: false,
      country: "United Kingdom",
      countryCode: "GB",
      currency: "GBP",
      locale: "en-GB",
      timezone: "Europe/London",
      taxLabel: "VAT",
      pricingProfile: "voice_uk_gbp",
      complianceProfile: "uk_standard_voice",
    },
    branchId: "branch-uk-2",
    phone: "+44 161 496 0000",
    sourceType: "VoiceReservationRequest" as const,
  },
  {
    label: "Pakistan restaurant",
    organization: {
      id: "pk-restaurant",
      marketKey: "pk",
      marketRequiresReview: false,
      country: "Pakistan",
      countryCode: "PK",
      currency: "PKR",
      locale: "en-PK",
      timezone: "Asia/Karachi",
      taxLabel: "Sales Tax",
      pricingProfile: "voice_pk_pkr",
      complianceProfile: "pk_standard_voice",
    },
    branchId: "branch-pk-1",
    phone: "0300 1234567",
    sourceType: "VoiceOrderRequest" as const,
  },
  {
    label: "Pakistan service business",
    organization: {
      id: "pk-service",
      marketKey: "pk",
      marketRequiresReview: false,
      country: "Pakistan",
      countryCode: "PK",
      currency: "PKR",
      locale: "en-PK",
      timezone: "Asia/Karachi",
      taxLabel: "Sales Tax",
      pricingProfile: "voice_pk_pkr",
      complianceProfile: "pk_standard_voice",
    },
    branchId: "branch-pk-2",
    phone: "+92 42 111 222 333",
    sourceType: "VoiceLead" as const,
  },
];

test("review workflow keeps four pilot tenants isolated by market, phone rules, and approval defaults", () => {
  for (const tenant of tenants) {
    const market = resolveTenantMarketContextFromOrganization(tenant.organization);
    assert.equal(market.status, "resolved", `${tenant.label} should resolve a tenant market.`);
    if (market.status !== "resolved") continue;

    assert.equal(deriveInitialVoiceReviewStatus(tenant.sourceType), tenant.sourceType === "VoiceLead" ? "captured" : "needs_staff_review");
    assert.doesNotThrow(() => assertRequestedMarketMatchesTenant(market, tenant.organization.marketKey));

    const normalizedPhone = normalizeVoicePhone(tenant.phone, market.marketKey);
    assert.match(normalizedPhone ?? "", market.marketKey === "uk" ? /^\+44/ : /^\+92/);

    const idempotencyKey = buildVoiceErpIdempotencyKey({
      organizationId: tenant.organization.id,
      branchId: tenant.branchId,
      providerCallId: "call-1",
      requestId: "req-1",
      outcomeType: tenant.sourceType === "VoiceReservationRequest" ? "booking" : "order",
    });
    assert.match(idempotencyKey, new RegExp(`:${tenant.organization.id}:${tenant.branchId}:call-1:req-1$`));
  }
});

test("approval transitions remain explicit and staff-first", () => {
  assert.deepEqual(voiceReviewTransitionMap.captured, [
    "needs_information",
    "needs_staff_review",
    "approved",
    "rejected",
    "dead_lettered",
  ]);
  assert.ok(voiceReviewTransitionMap.needs_staff_review.includes("approved"));
  assert.ok(voiceReviewTransitionMap.failed.includes("needs_staff_review"));
  assert.equal(voiceReviewTransitionMap.processing.includes("completed"), true);
});

test("approved order drafts stay tenant-scoped, unpaid, and backend priced", () => {
  const draft = buildApprovedVoiceOrderDraft({
    requestId: "voice-order-12345678",
    marketKey: "uk",
    customerId: "cust-1",
    branchId: "branch-1",
    lines: [
      { productId: "prod-1", productName: "Consultation", quantity: 2, unitPrice: 43 },
      { productId: "prod-2", productName: "Follow-up", quantity: 1, unitPrice: 99 },
    ],
  });

  assert.equal(draft.status, "DRAFT");
  assert.equal(draft.totalAmount, 185);
  assert.equal(draft.invoiceNumber, "VOI-UK-12345678");
});

test("UK British voice catalogue stays country-scoped during acceptance coverage", () => {
  const voices = getApprovedVapiVoicesForCountry("GB");
  assert.ok(voices.length >= 1);
  assert.ok(voices.every((voice) => voice.locale === "en-GB"));
  assert.ok(voices.every((voice) => voice.accent === "British"));
});

test("tenant isolation rejects cross-market overrides", () => {
  const ukMarket = resolveTenantMarketContextFromOrganization(tenants[0].organization);
  assert.equal(ukMarket.status, "resolved");
  if (ukMarket.status === "resolved") {
    assert.throws(() => assertRequestedMarketMatchesTenant(ukMarket, "pk"));
  }
});
