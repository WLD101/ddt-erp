import test from "node:test";
import assert from "node:assert/strict";

import {
  INDUSTRY_PROFILES,
  getDefaultEnabledModuleIds,
  resolveIndustryProfileFromLegacyIndustry,
  resolveIndustryProfileRecommendation,
} from "../../modules/onboarding/industry-profiles";

test("legacy industries resolve to verified profile keys", () => {
  assert.equal(resolveIndustryProfileFromLegacyIndustry("retail"), "retail");
  assert.equal(resolveIndustryProfileFromLegacyIndustry("service"), "service_basic");
  assert.equal(resolveIndustryProfileFromLegacyIndustry("restaurant"), "restaurant_voice");
  assert.equal(resolveIndustryProfileFromLegacyIndustry("real_estate"), null);
});

test("active and beta profiles expose at least one module", () => {
  for (const profile of Object.values(INDUSTRY_PROFILES)) {
    if (profile.status === "active" || profile.status === "beta") {
      assert.equal(profile.enabledModules.length > 0, true, `${profile.key} should expose modules`);
      assert.deepEqual(getDefaultEnabledModuleIds(profile.key), profile.enabledModules.map((module) => module.id));
    }
  }
});

test("manufacturing-style answers resolve to the manufacturing profile", () => {
  const result = resolveIndustryProfileRecommendation("manufacturing", {
    businessType: "manufacturing",
    fulfilmentMode: "future",
    offeringType: "manufactured_goods",
    requiresQuotes: true,
    managesInventory: true,
    managesRawMaterials: true,
    preparesBeforeFulfilment: true,
    offersDeliveryOrCollection: "delivery",
    paymentPattern: "invoice",
    resourceAssignment: ["staff", "machines"],
    recurringNeeds: false,
    existingSoftware: ["Excel"],
  });

  assert.equal(result.profileKey, "manufacturing");
  assert.equal(result.summary.capabilities.includes("supports_production"), true);
});

test("service appointment answers resolve to service-basic or clinic-safe profile", () => {
  const result = resolveIndustryProfileRecommendation("service_basic", {
    businessType: "service",
    fulfilmentMode: "future",
    offeringType: "services",
    requiresQuotes: true,
    managesInventory: false,
    managesRawMaterials: false,
    preparesBeforeFulfilment: false,
    offersDeliveryOrCollection: "none",
    paymentPattern: "deposit",
    resourceAssignment: ["staff", "rooms"],
    recurringNeeds: false,
    existingSoftware: ["Google Calendar"],
  });

  assert.equal(["service_basic", "clinic_voice"].includes(result.profileKey), true);
});
