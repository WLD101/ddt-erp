import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  handleStripeInvoiceFailed,
  handleStripeInvoicePaid,
  recordStripeWebhookEvent,
  syncStripeCheckoutSession,
  syncStripeSubscription,
} from "@/lib/billing/subscription";
import { getStripe, getStripeWebhookSecret } from "@/lib/billing/stripe";

function readOrganizationId(event: Stripe.Event) {
  const object = event.data.object as unknown as Record<string, unknown>;
  const metadata = (object.metadata as Record<string, unknown> | undefined) ?? undefined;
  return typeof metadata?.organizationId === "string" ? metadata.organizationId : undefined;
}

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is missing." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook signature." },
      { status: 400 },
    );
  }

  const created = await recordStripeWebhookEvent(event, readOrganizationId(event));
  if (!created) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncStripeCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncStripeSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        await handleStripeInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleStripeInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
