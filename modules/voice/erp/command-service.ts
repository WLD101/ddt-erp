import type { ScopedPrisma } from "@/lib/db/client";
import {
  assertRequestedMarketMatchesTenant,
  assertResolvedTenantMarketContext,
  getTenantMarketContext,
} from "@/modules/markets/tenant-market";
import { resolveVoiceCustomer, type VoiceCustomerIdentity } from "./customer-resolution";
import { getVoiceErpAutomationConfig } from "./automation-config";
import { assessVoiceOrderConversion } from "./order-conversion";
import { assessVoiceBookingConversion } from "./booking-conversion";
import { assessVoicePaymentConversion } from "./payment-conversion";
import { buildVoiceErpIdempotencyKey } from "./outcome-links";

export class VoiceErpCommandError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "VoiceErpCommandError";
    this.code = code;
  }
}

export async function resolveVoiceCustomerForTenant(input: {
  db: ScopedPrisma;
  organizationId: string;
  branchId: string;
  identity: VoiceCustomerIdentity;
  requestedMarketKey?: string | null;
}) {
  if (input.db.organizationId !== input.organizationId) {
    throw new VoiceErpCommandError("TENANT_SCOPE_MISMATCH", "Scoped tenant store does not match the requested organization.");
  }

  const marketContext = await getTenantMarketContext(input.organizationId);
  try {
    assertResolvedTenantMarketContext(marketContext);
    assertRequestedMarketMatchesTenant(marketContext, input.requestedMarketKey);
  } catch (error) {
    throw new VoiceErpCommandError("MARKET_VALIDATION_FAILED", error instanceof Error ? error.message : "Tenant market validation failed.");
  }

  return resolveVoiceCustomer(input.db, input.identity, {
    marketKey: marketContext.marketKey,
  });
}

export async function prepareVoiceOrderRequestForErp(input: {
  db: ScopedPrisma;
  organizationId: string;
  branchId: string;
  requestId: string;
  providerCallId?: string | null;
  requestedMarketKey?: string | null;
  orderDetailsText: string;
  confirmedCatalogItems: Array<{ productId: string; quantity: number }> | null;
  approvalGranted: boolean;
}) {
  const marketContext = await getTenantMarketContext(input.organizationId);
  try {
    assertResolvedTenantMarketContext(marketContext);
    assertRequestedMarketMatchesTenant(marketContext, input.requestedMarketKey);
  } catch (error) {
    throw new VoiceErpCommandError("MARKET_VALIDATION_FAILED", error instanceof Error ? error.message : "Tenant market validation failed.");
  }

  const automation = await getVoiceErpAutomationConfig(input.organizationId);
  const readiness = assessVoiceOrderConversion({
    automation,
    orderDetailsText: input.orderDetailsText,
    confirmedCatalogItems: input.confirmedCatalogItems,
    approvalGranted: input.approvalGranted,
  });

  return {
    ...readiness,
    market: marketContext.marketKey,
    currency: marketContext.currency,
    locale: marketContext.locale,
    timezone: marketContext.timezone,
    taxLabel: marketContext.taxLabel,
    paymentProfile: marketContext.paymentMethods,
    idempotencyKey: buildVoiceErpIdempotencyKey({
      organizationId: input.organizationId,
      branchId: input.branchId,
      providerCallId: input.providerCallId,
      requestId: input.requestId,
      outcomeType: "order",
    }),
  };
}

export async function prepareVoiceBookingRequestForErp(input: {
  organizationId: string;
  branchId: string;
  requestId: string;
  providerCallId?: string | null;
  requestedMarketKey?: string | null;
  requestedTime: Date | null;
  customerName: string | null;
  approvalGranted: boolean;
}) {
  const marketContext = await getTenantMarketContext(input.organizationId);
  try {
    assertResolvedTenantMarketContext(marketContext);
    assertRequestedMarketMatchesTenant(marketContext, input.requestedMarketKey);
  } catch (error) {
    throw new VoiceErpCommandError("MARKET_VALIDATION_FAILED", error instanceof Error ? error.message : "Tenant market validation failed.");
  }

  const automation = await getVoiceErpAutomationConfig(input.organizationId);
  const readiness = assessVoiceBookingConversion({
    automation,
    requestedTime: input.requestedTime,
    customerName: input.customerName,
    approvalGranted: input.approvalGranted,
  });

  return {
    ...readiness,
    market: marketContext.marketKey,
    currency: marketContext.currency,
    locale: marketContext.locale,
    timezone: marketContext.timezone,
    taxLabel: marketContext.taxLabel,
    paymentProfile: marketContext.paymentMethods,
    idempotencyKey: buildVoiceErpIdempotencyKey({
      organizationId: input.organizationId,
      branchId: input.branchId,
      providerCallId: input.providerCallId,
      requestId: input.requestId,
      outcomeType: "booking",
    }),
  };
}

export async function prepareVoicePaymentForErp(input: {
  organizationId: string;
  branchId: string;
  requestId: string;
  providerCallId?: string | null;
  requestedMarketKey?: string | null;
  paymentMethod: string | null;
  paymentConfirmed: boolean;
}) {
  const marketContext = await getTenantMarketContext(input.organizationId);
  try {
    assertResolvedTenantMarketContext(marketContext);
    assertRequestedMarketMatchesTenant(marketContext, input.requestedMarketKey);
  } catch (error) {
    throw new VoiceErpCommandError("MARKET_VALIDATION_FAILED", error instanceof Error ? error.message : "Tenant market validation failed.");
  }

  const automation = await getVoiceErpAutomationConfig(input.organizationId);
  const readiness = assessVoicePaymentConversion({
    automation,
    marketKey: marketContext.marketKey,
    paymentMethod: input.paymentMethod,
    paymentConfirmed: input.paymentConfirmed,
  });

  return {
    ...readiness,
    market: marketContext.marketKey,
    currency: marketContext.currency,
    locale: marketContext.locale,
    timezone: marketContext.timezone,
    taxLabel: marketContext.taxLabel,
    paymentProfile: marketContext.paymentMethods,
    idempotencyKey: buildVoiceErpIdempotencyKey({
      organizationId: input.organizationId,
      branchId: input.branchId,
      providerCallId: input.providerCallId,
      requestId: input.requestId,
      outcomeType: "payment",
    }),
  };
}
