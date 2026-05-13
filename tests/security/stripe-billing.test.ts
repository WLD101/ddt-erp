import assert from "node:assert/strict";
import test from "node:test";

import { getSubscriptionIdFromStripeInvoice } from "../../lib/billing/subscription";
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

test("stripe invoice subscription lookup supports both current and legacy payload shapes", () => {
  const currentShape = {
    parent: {
      subscription_details: {
        subscription: "sub_current_shape",
      },
    },
  } as Parameters<typeof getSubscriptionIdFromStripeInvoice>[0];

  const legacyShape = {
    subscription: "sub_legacy_shape",
  } as Parameters<typeof getSubscriptionIdFromStripeInvoice>[0];

  const missingShape = {} as Parameters<typeof getSubscriptionIdFromStripeInvoice>[0];

  assert.equal(getSubscriptionIdFromStripeInvoice(currentShape), "sub_current_shape");
  assert.equal(getSubscriptionIdFromStripeInvoice(legacyShape), "sub_legacy_shape");
  assert.equal(getSubscriptionIdFromStripeInvoice(missingShape), null);
});
