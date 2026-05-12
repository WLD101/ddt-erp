import assert from "node:assert/strict";
import test from "node:test";

import { getAvailableStripeBillingCycles, getStripePriceId, resolvePlanIdFromStripePriceId } from "../../lib/billing/stripe";

test("stripe price helpers resolve monthly and yearly plan mappings", () => {
  const original = {
    starterMonthly: process.env.STRIPE_STARTER_PRICE_ID,
    starterYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    businessMonthly: process.env.STRIPE_BUSINESS_PRICE_ID,
  };

  process.env.STRIPE_STARTER_PRICE_ID = "price_starter_monthly_test";
  process.env.STRIPE_STARTER_YEARLY_PRICE_ID = "price_starter_yearly_test";
  process.env.STRIPE_BUSINESS_PRICE_ID = "price_business_monthly_test";

  try {
    assert.deepEqual(getAvailableStripeBillingCycles("starter"), {
      monthly: true,
      yearly: true,
    });
    assert.equal(getStripePriceId("starter", "MONTHLY"), "price_starter_monthly_test");
    assert.equal(getStripePriceId("starter", "YEARLY"), "price_starter_yearly_test");
    assert.equal(resolvePlanIdFromStripePriceId("price_business_monthly_test"), "business");
  } finally {
    process.env.STRIPE_STARTER_PRICE_ID = original.starterMonthly;
    process.env.STRIPE_STARTER_YEARLY_PRICE_ID = original.starterYearly;
    process.env.STRIPE_BUSINESS_PRICE_ID = original.businessMonthly;
  }
});
