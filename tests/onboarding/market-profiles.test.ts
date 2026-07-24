import test from "node:test";
import assert from "node:assert/strict";

import {
  getAvailableIndustryProfilesForMarket,
  getMarketDefaults,
  MARKET_PROFILES,
  resolveMarketAwareRecommendation,
  resolveMarketKeyFromSignals,
} from "../../modules/onboarding/market-profiles";

test("market profiles expose correct defaults for UK and Pakistan", () => {
  assert.equal(MARKET_PROFILES.uk.currency, "GBP");
  assert.equal(MARKET_PROFILES.uk.locale, "en-GB");
  assert.equal(MARKET_PROFILES.uk.defaultTimeZone, "Europe/London");
  assert.equal(MARKET_PROFILES.pk.currency, "PKR");
  assert.equal(MARKET_PROFILES.pk.locale, "en-PK");
  assert.equal(MARKET_PROFILES.pk.defaultTimeZone, "Asia/Karachi");
});

test("market key can be inferred from reliable country and timezone signals", () => {
  assert.equal(resolveMarketKeyFromSignals({ country: "Pakistan" }), "pk");
  assert.equal(resolveMarketKeyFromSignals({ timezone: "Europe/London" }), "uk");
  assert.equal(resolveMarketKeyFromSignals({ country: "Canada", currency: "USD" }), null);
});

test("market availability differs by country profile", () => {
  assert.equal(getAvailableIndustryProfilesForMarket("uk").includes("textile"), false);
  assert.equal(getAvailableIndustryProfilesForMarket("pk").includes("textile"), true);
});

test("market-aware recommendation adds different integration priorities", () => {
  const uk = resolveMarketAwareRecommendation("uk", "service_basic", {
    businessType: "service",
    fulfilmentMode: "future",
    offeringType: "services",
    requiresQuotes: true,
    managesInventory: false,
    managesRawMaterials: false,
    preparesBeforeFulfilment: false,
    offersDeliveryOrCollection: "none",
    paymentPattern: "deposit",
    resourceAssignment: ["staff"],
    recurringNeeds: true,
    existingSoftware: ["Google Calendar"],
  });

  const pk = resolveMarketAwareRecommendation("pk", "wholesale", {
    businessType: "wholesale",
    fulfilmentMode: "both",
    offeringType: "products",
    requiresQuotes: true,
    managesInventory: true,
    managesRawMaterials: false,
    preparesBeforeFulfilment: false,
    offersDeliveryOrCollection: "delivery",
    paymentPattern: "invoice",
    resourceAssignment: ["staff", "branches"],
    recurringNeeds: false,
    existingSoftware: ["Excel"],
  });

  assert.equal(uk.integrations.some((item) => item.key === "google_calendar"), true);
  assert.equal(pk.integrations.some((item) => item.key === "whatsapp_business"), true);
});

test("market defaults provide pricing and compliance source-of-truth keys", () => {
  const uk = getMarketDefaults("uk");
  const pk = getMarketDefaults("pk");

  assert.equal(uk.pricingProfile, "voice_uk_gbp");
  assert.equal(uk.complianceProfile, "uk_standard_voice");
  assert.equal(pk.pricingProfile, "voice_pk_pkr");
  assert.equal(pk.complianceProfile, "pk_standard_voice");
});
