import { addDays, isAfter } from "date-fns";
import Stripe from "stripe";

import { inferPlanIdFromPackage, getActivePackageRecordForPlanId } from "@/lib/billing/catalog";
import { type BillingCycle, type PlanId, normalizePlanId } from "@/lib/billing/plans";
import { getStripe, getStripeAppUrl, getStripePriceId, resolvePlanIdFromStripePriceId } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

const PAID_GRACE_DAYS = 15;
type CheckoutBillingCycle = Extract<BillingCycle, "MONTHLY" | "YEARLY">;

function unixToDate(value?: number | null, fallback?: Date) {
  if (typeof value === "number") {
    return new Date(value * 1000);
  }
  return fallback ?? new Date();
}

async function resolveOrganizationLifecycleStatus(
  organizationId: string,
  activeValue: "active" | "onboarding" | "blocked",
) {
  if (activeValue === "blocked") {
    return "blocked";
  }
  const onboarding = await prisma.onboardingState.findUnique({
    where: { organizationId },
    select: { isCompleted: true },
  });
  if (activeValue === "active" && onboarding && !onboarding.isCompleted) {
    return "onboarding";
  }
  return activeValue;
}

function resolveStripeStatus(snapshot: {
  stripeStatus: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date;
}) {
  const now = new Date();
  const graceEndsAt = addDays(snapshot.currentPeriodEnd, PAID_GRACE_DAYS);

  switch (snapshot.stripeStatus) {
    case "active":
    case "trialing":
      return {
        subscriptionStatus: snapshot.stripeStatus === "trialing" ? "trialing" : "active",
        paymentStatus: "paid",
        accessStatus: "active",
        organizationAccessStatus: "active",
        lifecycleStatus: "active" as const,
        blockedAt: null,
        expiredAt: null,
        graceEndsAt: null,
      };
    case "past_due":
    case "unpaid":
      return {
        subscriptionStatus: "past_due",
        paymentStatus: "failed",
        accessStatus: "grace_period",
        organizationAccessStatus: "grace_period",
        lifecycleStatus: "active" as const,
        blockedAt: null,
        expiredAt: null,
        graceEndsAt,
      };
    case "canceled":
      return {
        subscriptionStatus: "cancelled",
        paymentStatus: "failed",
        accessStatus: isAfter(now, snapshot.currentPeriodEnd) ? "expired" : "grace_period",
        organizationAccessStatus: isAfter(now, snapshot.currentPeriodEnd) ? "expired" : "grace_period",
        lifecycleStatus: isAfter(now, snapshot.currentPeriodEnd) ? ("blocked" as const) : ("active" as const),
        blockedAt: isAfter(now, snapshot.currentPeriodEnd) ? now : null,
        expiredAt: now,
        graceEndsAt: isAfter(now, snapshot.currentPeriodEnd) ? graceEndsAt : snapshot.currentPeriodEnd,
      };
    case "incomplete":
      return {
        subscriptionStatus: "payment_pending",
        paymentStatus: "payment_pending",
        accessStatus: "payment_pending",
        organizationAccessStatus: "payment_pending",
        lifecycleStatus: "onboarding" as const,
        blockedAt: null,
        expiredAt: null,
        graceEndsAt: null,
      };
    default:
      return {
        subscriptionStatus: "failed",
        paymentStatus: "failed",
        accessStatus: "blocked",
        organizationAccessStatus: "blocked",
        lifecycleStatus: "blocked" as const,
        blockedAt: now,
        expiredAt: now,
        graceEndsAt: null,
      };
  }
}

async function resolveLocalSubscriptionTarget(
  stripeSubscription: Stripe.Subscription,
  fallbackOrganizationId?: string | null,
) {
  const subscriptionId = typeof stripeSubscription.id === "string" ? stripeSubscription.id : null;
  const stripeCustomerId =
    typeof stripeSubscription.customer === "string" ? stripeSubscription.customer : stripeSubscription.customer?.id;
  const metadataOrgId = stripeSubscription.metadata?.organizationId || fallbackOrganizationId || null;

  let localSubscription = subscriptionId
    ? await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      })
    : null;

  if (!localSubscription && metadataOrgId) {
    localSubscription = await prisma.subscription.findUnique({
      where: { organizationId: metadataOrgId },
    });
  }

  if (!localSubscription && stripeCustomerId) {
    localSubscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId },
    });
  }

  if (!localSubscription) {
    throw new Error(`No local subscription found for Stripe subscription ${stripeSubscription.id}.`);
  }

  return localSubscription;
}

export async function preparePackageSelectionForCheckout(
  organizationId: string,
  planId: PlanId,
  billingCycle: CheckoutBillingCycle,
) {
  const packageRecord = await getActivePackageRecordForPlanId(planId);
  if (!packageRecord) {
    throw new Error(`Package for ${planId} is not available.`);
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.organizationPackage.upsert({
      where: { organizationId },
      update: {
        packageId: packageRecord.id,
        isCustomPackage: false,
        customPackageName: null,
        customPrice: null,
        customUserLimit: null,
        customBranchLimit: null,
        customBillingCycle: null,
        customExpiryDate: null,
        customFeatureJson: null,
        assignedAt: now,
      },
      create: {
        organizationId,
        packageId: packageRecord.id,
      },
    }),
    prisma.subscription.update({
      where: { organizationId },
      data: {
        packageId: packageRecord.id,
        planId,
        billingCycle,
        billingSource: "stripe",
        status: "payment_pending",
        paymentStatus: "payment_pending",
        accessStatus: "payment_pending",
        currentPeriodStart: now,
        currentPeriodEnd: now,
        blockedAt: null,
        expiredAt: null,
        graceEndsAt: null,
        cancelAtPeriodEnd: false,
      },
    }),
    prisma.organization.update({
      where: { id: organizationId },
      data: {
        accessStatus: "payment_pending",
        lifecycleStatus: "onboarding",
        blockedAt: null,
      },
    }),
  ]);

  return packageRecord;
}

export async function createStripeCheckoutSession(input: {
  organizationId: string;
  userId: string;
  userEmail: string | null | undefined;
  userName?: string | null;
  planId: PlanId;
  billingCycle: CheckoutBillingCycle;
}) {
  if (input.planId === "enterprise") {
    throw new Error("Enterprise plans must be activated manually by a platform administrator.");
  }

  const packageRecord = await preparePackageSelectionForCheckout(
    input.organizationId,
    input.planId,
    input.billingCycle,
  );
  const stripe = getStripe();
  const priceId = getStripePriceId(input.planId, input.billingCycle);
  const existingSubscription = await prisma.subscription.findUnique({
    where: { organizationId: input.organizationId },
  });

  if (
    existingSubscription?.billingSource === "stripe" &&
    existingSubscription.stripeSubscriptionId &&
    ["active", "trialing", "past_due", "payment_pending"].includes(existingSubscription.status)
  ) {
    throw new Error("This workspace already has a Stripe subscription. Use the billing portal to manage plan changes.");
  }

  const customerId = existingSubscription?.stripeCustomerId
    ? existingSubscription.stripeCustomerId
    : (
        await stripe.customers.create({
          email: input.userEmail || undefined,
          name: input.userName || undefined,
          metadata: {
            organizationId: input.organizationId,
            userId: input.userId,
            planId: input.planId,
          },
        })
      ).id;

  const appUrl = getStripeAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: input.organizationId,
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancel?plan=${input.planId}`,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    metadata: {
      organizationId: input.organizationId,
      userId: input.userId,
      planId: input.planId,
      billingCycle: input.billingCycle,
      packageId: packageRecord.id,
      priceId,
    },
    subscription_data: {
      metadata: {
        organizationId: input.organizationId,
        userId: input.userId,
        planId: input.planId,
        billingCycle: input.billingCycle,
        packageId: packageRecord.id,
        priceId,
      },
    },
  });

  await prisma.subscription.update({
    where: { organizationId: input.organizationId },
    data: {
      planId: input.planId,
      packageId: packageRecord.id,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      stripeCheckoutSessionId: session.id,
      billingCycle: input.billingCycle,
      billingSource: "stripe",
      status: "payment_pending",
      paymentStatus: "payment_pending",
      accessStatus: "payment_pending",
    },
  });

  return session;
}

export async function createStripeBillingPortalSession(input: {
  organizationId: string;
  returnPath?: string;
}) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: input.organizationId },
  });
  if (!subscription?.stripeCustomerId) {
    throw new Error("No Stripe customer is linked to this workspace yet.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${getStripeAppUrl()}${input.returnPath || "/settings/billing"}`,
  });

  return session.url;
}

export async function syncStripeCheckoutSession(session: Stripe.Checkout.Session) {
  const organizationId =
    session.metadata?.organizationId || session.client_reference_id || null;
  if (!organizationId) {
    throw new Error(`Checkout session ${session.id} is missing organization metadata.`);
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id || null;
  const planId = normalizePlanId(session.metadata?.planId) || null;
  const packageRecord = planId ? await getActivePackageRecordForPlanId(planId) : null;

  await prisma.subscription.update({
    where: { organizationId },
    data: {
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: session.metadata?.priceId || undefined,
      packageId: packageRecord?.id,
      planId: planId ?? undefined,
      paymentStatus: session.payment_status === "paid" ? "paid" : "payment_pending",
    },
  });

  if (subscriptionId) {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncStripeSubscription(subscription, organizationId);
  }
}

export async function syncStripeSubscription(
  stripeSubscription: Stripe.Subscription,
  fallbackOrganizationId?: string | null,
) {
  const localSubscription = await resolveLocalSubscriptionTarget(stripeSubscription, fallbackOrganizationId);
  const recurringPrice = stripeSubscription.items.data[0]?.price ?? null;
  const priceId = recurringPrice?.id || null;
  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id || localSubscription.stripeCustomerId;
  const planId =
    resolvePlanIdFromStripePriceId(priceId) ||
    normalizePlanId(stripeSubscription.metadata?.planId) ||
    inferPlanIdFromPackage(
      localSubscription.packageId
        ? await prisma.package.findUnique({ where: { id: localSubscription.packageId } })
        : null,
      localSubscription.planId,
    );
  const packageRecord = await getActivePackageRecordForPlanId(planId);
  const primaryItem = stripeSubscription.items.data[0];
  const currentPeriodStart = unixToDate(primaryItem?.current_period_start ?? stripeSubscription.billing_cycle_anchor, new Date());
  const currentPeriodEnd = unixToDate(
    primaryItem?.current_period_end ?? stripeSubscription.cancel_at ?? primaryItem?.current_period_start ?? stripeSubscription.billing_cycle_anchor,
    currentPeriodStart,
  );
  const mapped = resolveStripeStatus({
    stripeStatus: stripeSubscription.status,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    currentPeriodEnd,
  });
  const lifecycleStatus = await resolveOrganizationLifecycleStatus(
    localSubscription.organizationId,
    mapped.lifecycleStatus,
  );

  await prisma.$transaction([
    prisma.subscription.update({
      where: { organizationId: localSubscription.organizationId },
      data: {
        packageId: packageRecord?.id ?? localSubscription.packageId,
        planId,
        status: mapped.subscriptionStatus,
        paymentStatus: mapped.paymentStatus,
        accessStatus: mapped.accessStatus,
        billingSource: "stripe",
        billingCycle:
          stripeSubscription.items.data[0]?.price.recurring?.interval === "year"
            ? "YEARLY"
            : "MONTHLY",
        stripeCustomerId: customerId ?? localSubscription.stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodStart,
        currentPeriodEnd,
        activatedAt: mapped.accessStatus === "active" ? new Date() : localSubscription.activatedAt,
        blockedAt: mapped.blockedAt,
        expiredAt: mapped.expiredAt,
        graceEndsAt: mapped.graceEndsAt,
      },
    }),
    prisma.organization.update({
      where: { id: localSubscription.organizationId },
      data: {
        accessStatus: mapped.organizationAccessStatus,
        lifecycleStatus,
        isDemoTenant: false,
        activatedAt: mapped.organizationAccessStatus === "active" ? new Date() : undefined,
        blockedAt: mapped.blockedAt,
        graceEndsAt: mapped.graceEndsAt,
      },
    }),
  ]);
}

export function getSubscriptionIdFromStripeInvoice(invoice: Stripe.Invoice) {
  const nestedSubscription =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id || null;

  if (nestedSubscription) {
    return nestedSubscription;
  }

  const legacySubscription = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription;
  return typeof legacySubscription === "string" ? legacySubscription : legacySubscription?.id || null;
}

export async function handleStripeInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromStripeInvoice(invoice);
  if (!subscriptionId) return;
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(subscription);
}

export async function handleStripeInvoiceFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromStripeInvoice(invoice);
  if (!subscriptionId) return;
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(subscription);
}

export async function recordStripeWebhookEvent(event: Stripe.Event, organizationId?: string | null) {
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        organizationId: organizationId || null,
        payload: JSON.stringify({ created: event.created }),
      },
    });
    return true;
  } catch (error) {
    if (error instanceof Error && /Unique constraint/i.test(error.message)) {
      return false;
    }
    throw error;
  }
}
