import Stripe from "stripe";

import { type BillingCycle, type PlanId } from "@/lib/billing/plans";

const STRIPE_API_VERSION = "2026-04-22.dahlia" as const;

let stripeClient: Stripe | null = null;

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null;
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function isStripeConfigured() {
  return Boolean(getStripeSecretKey() && getStripePublishableKey() && getStripeWebhookSecret());
}

export function getStripe() {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new Error("Stripe is not configured. STRIPE_SECRET_KEY is missing.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
  }
  return stripeClient;
}

export function getStripeAppUrl() {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000"
  );
}

function readPriceEnv(planId: PlanId, billingCycle: Extract<BillingCycle, "MONTHLY" | "YEARLY">) {
  const prefix = planId.toUpperCase();
  if (billingCycle === "MONTHLY") {
    return (
      process.env[`STRIPE_${prefix}_MONTHLY_PRICE_ID`] ||
      process.env[`STRIPE_${prefix}_PRICE_ID`] ||
      null
    );
  }
  return process.env[`STRIPE_${prefix}_YEARLY_PRICE_ID`] || null;
}

export function getStripePriceId(planId: PlanId, billingCycle: Extract<BillingCycle, "MONTHLY" | "YEARLY">) {
  const priceId = readPriceEnv(planId, billingCycle)?.trim() || null;
  if (!priceId) {
    throw new Error(`Stripe price is not configured for ${planId} (${billingCycle.toLowerCase()}).`);
  }
  return priceId;
}

export function getAvailableStripeBillingCycles(planId: PlanId) {
  const monthly = Boolean(readPriceEnv(planId, "MONTHLY"));
  const yearly = Boolean(readPriceEnv(planId, "YEARLY"));
  return {
    monthly,
    yearly,
  };
}

export function resolvePlanIdFromStripePriceId(priceId?: string | null): PlanId | null {
  if (!priceId) return null;
  const planIds: PlanId[] = ["starter", "business", "pro"];
  for (const planId of planIds) {
    if (readPriceEnv(planId, "MONTHLY") === priceId || readPriceEnv(planId, "YEARLY") === priceId) {
      return planId;
    }
  }
  return null;
}
