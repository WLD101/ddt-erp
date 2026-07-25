import { prisma } from "@/lib/prisma";
import { getTenantStore, type ScopedPrisma } from "@/lib/db/client";
import type { TenantContext } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logVoiceAction } from "@/modules/voice/audit/service";
import { getTenantMarketContext, assertResolvedTenantMarketContext } from "@/modules/markets/tenant-market";
import { resolveVoiceCustomer, type VoiceCustomerIdentity } from "@/modules/voice/erp/customer-resolution";
import { buildVoiceErpIdempotencyKey } from "@/modules/voice/erp/outcome-links";
import {
  assertValidVoiceReviewTransition,
  buildApprovedVoiceOrderDraft,
  deriveInitialVoiceReviewStatus,
  normalizeVoiceReviewStatus,
  parseRequestedBookingDateTime,
  assertVoiceBookingAvailability,
  type VoiceReviewStatus,
} from "@/modules/voice/review/workflow";

type ReviewSourceType = "VoiceLead" | "VoiceOrderRequest" | "VoiceReservationRequest";

type ReviewListItem = Awaited<ReturnType<typeof prisma.voiceReviewItem.findMany>>[number];
type ReviewActionContext = {
  ctx: TenantContext;
  reviewItemId: string;
  expectedVersion: number;
};

function parseJsonObject(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function getDefaultVoiceBranchId(organizationId: string) {
  const branch = await prisma.branch.findFirst({
    where: { organizationId },
    orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!branch) {
    throw new Error("No tenant branch is configured for this organization.");
  }
  return branch.id;
}

async function recordTransition(input: {
  organizationId: string;
  reviewItemId: string;
  branchId: string;
  requestId: string;
  providerCallId?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  previousStatus?: string | null;
  newStatus: VoiceReviewStatus;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.voiceReviewTransition.create({
    data: {
      organizationId: input.organizationId,
      reviewItemId: input.reviewItemId,
      branchId: input.branchId,
      requestId: input.requestId,
      providerCallId: input.providerCallId || null,
      actorUserId: input.actorUserId || null,
      actorRole: input.actorRole || null,
      previousStatus: input.previousStatus || null,
      newStatus: input.newStatus,
      reason: input.reason || null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

async function updateSourceStatus(sourceType: ReviewSourceType, sourceId: string, status: string) {
  if (sourceType === "VoiceLead") {
    await prisma.voiceLead.update({ where: { id: sourceId }, data: { status } });
    return;
  }
  if (sourceType === "VoiceOrderRequest") {
    await prisma.voiceOrderRequest.update({ where: { id: sourceId }, data: { status } });
    return;
  }
  await prisma.voiceReservationRequest.update({ where: { id: sourceId }, data: { status } });
}

export async function ensureVoiceReviewItemFromSource(input: {
  organizationId: string;
  sourceType: ReviewSourceType;
  sourceId: string;
  providerCallId?: string | null;
  voiceAgentId?: string | null;
  branchId?: string | null;
  customerSnapshot?: Record<string, unknown> | null;
  confirmedFields?: Record<string, unknown> | null;
  inferredFields?: Record<string, unknown> | null;
  unresolvedFields?: string[];
  validationErrors?: string[];
  proposedAction?: Record<string, unknown> | null;
}) {
  const branchId = input.branchId || (await getDefaultVoiceBranchId(input.organizationId));
  const marketContext = await getTenantMarketContext(input.organizationId);
  assertResolvedTenantMarketContext(marketContext);
  const initialStatus = deriveInitialVoiceReviewStatus(input.sourceType);

  const reviewItem = await prisma.voiceReviewItem.upsert({
    where: {
      organizationId_sourceType_sourceId: {
        organizationId: input.organizationId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    },
    update: {
      branchId,
      providerCallId: input.providerCallId || null,
      voiceAgentId: input.voiceAgentId || null,
      customerSnapshotJson: input.customerSnapshot ? JSON.stringify(input.customerSnapshot) : null,
      confirmedFieldsJson: input.confirmedFields ? JSON.stringify(input.confirmedFields) : null,
      inferredFieldsJson: input.inferredFields ? JSON.stringify(input.inferredFields) : null,
      unresolvedFieldsJson: input.unresolvedFields ? JSON.stringify(input.unresolvedFields) : null,
      validationErrorsJson: input.validationErrors ? JSON.stringify(input.validationErrors) : null,
      proposedActionJson: input.proposedAction ? JSON.stringify(input.proposedAction) : null,
    },
    create: {
      organizationId: input.organizationId,
      branchId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      requestType: input.sourceType,
      status: initialStatus,
      providerCallId: input.providerCallId || null,
      voiceAgentId: input.voiceAgentId || null,
      marketKey: marketContext.marketKey,
      currency: marketContext.currency,
      timezone: marketContext.timezone,
      customerSnapshotJson: input.customerSnapshot ? JSON.stringify(input.customerSnapshot) : null,
      confirmedFieldsJson: input.confirmedFields ? JSON.stringify(input.confirmedFields) : null,
      inferredFieldsJson: input.inferredFields ? JSON.stringify(input.inferredFields) : null,
      unresolvedFieldsJson: input.unresolvedFields ? JSON.stringify(input.unresolvedFields) : null,
      validationErrorsJson: input.validationErrors ? JSON.stringify(input.validationErrors) : null,
      proposedActionJson: input.proposedAction ? JSON.stringify(input.proposedAction) : null,
      idempotencyKey: buildVoiceErpIdempotencyKey({
        organizationId: input.organizationId,
        branchId,
        providerCallId: input.providerCallId,
        requestId: input.sourceId,
        outcomeType: "review",
      }),
    },
  });

  const transitions = await prisma.voiceReviewTransition.count({
    where: { organizationId: input.organizationId, reviewItemId: reviewItem.id },
  });
  if (transitions === 0) {
    await recordTransition({
      organizationId: input.organizationId,
      reviewItemId: reviewItem.id,
      branchId,
      requestId: input.sourceId,
      providerCallId: input.providerCallId,
      previousStatus: null,
      newStatus: initialStatus,
      reason: "Voice request captured.",
    });
  }

  return reviewItem;
}

export async function listVoiceReviewInbox(organizationId: string) {
  return prisma.voiceReviewItem.findMany({
    where: { organizationId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getVoiceReviewItemDetails(organizationId: string, reviewItemId: string) {
  const reviewItem = await prisma.voiceReviewItem.findFirst({
    where: { organizationId, id: reviewItemId },
  });
  if (!reviewItem) {
    throw new Error("Voice review item not found.");
  }

  const transitions = await prisma.voiceReviewTransition.findMany({
    where: { organizationId, reviewItemId },
    orderBy: { createdAt: "asc" },
  });
  const outcomeLinks = await prisma.voiceOutcomeLink.findMany({
    where: { organizationId, reviewItemId },
    orderBy: { createdAt: "asc" },
  });
  const callLog = reviewItem.providerCallId
    ? await prisma.voiceCallLog.findFirst({
        where: { organizationId, providerCallId: reviewItem.providerCallId },
        select: {
          id: true,
          startedAt: true,
          summary: true,
          transcript: true,
          transcriptPlaceholder: true,
          recordingUrl: true,
        },
      })
    : null;

  let sourceRecord: Record<string, unknown> | null = null;
  if (reviewItem.sourceType === "VoiceLead") {
    sourceRecord = await prisma.voiceLead.findFirst({ where: { organizationId, id: reviewItem.sourceId } });
  } else if (reviewItem.sourceType === "VoiceOrderRequest") {
    sourceRecord = await prisma.voiceOrderRequest.findFirst({ where: { organizationId, id: reviewItem.sourceId } });
  } else {
    sourceRecord = await prisma.voiceReservationRequest.findFirst({ where: { organizationId, id: reviewItem.sourceId } });
  }

  return {
    reviewItem,
    transitions,
    outcomeLinks,
    callLog,
    sourceRecord,
    customerSnapshot: parseJsonObject(reviewItem.customerSnapshotJson),
    confirmedFields: parseJsonObject(reviewItem.confirmedFieldsJson),
    inferredFields: parseJsonObject(reviewItem.inferredFieldsJson),
    unresolvedFields: parseJsonArray(reviewItem.unresolvedFieldsJson),
    validationErrors: parseJsonArray(reviewItem.validationErrorsJson),
    proposedAction: parseJsonObject(reviewItem.proposedActionJson),
  };
}

async function transitionReviewItemStatus(input: {
  ctx: TenantContext;
  reviewItem: ReviewListItem;
  nextStatus: VoiceReviewStatus;
  expectedVersion?: number;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const previousStatus = normalizeVoiceReviewStatus(input.reviewItem.status);
  assertValidVoiceReviewTransition(previousStatus, input.nextStatus);

  const expectedVersion = input.expectedVersion ?? input.reviewItem.version;
  const updatedCount = await prisma.voiceReviewItem.updateMany({
    where: {
      id: input.reviewItem.id,
      organizationId: input.ctx.organizationId,
      branchId: input.ctx.branchId,
      version: expectedVersion,
      status: previousStatus,
    },
    data: {
      status: input.nextStatus,
      version: { increment: 1 },
      lastReason: input.reason || null,
      approvedByUserId: input.nextStatus === "approved" || input.nextStatus === "completed" ? input.ctx.userId : input.reviewItem.approvedByUserId,
      completedAt: input.nextStatus === "completed" ? new Date() : input.nextStatus === "reversed" ? null : input.reviewItem.completedAt,
    },
  });
  if (updatedCount.count !== 1) {
    throw new Error("This review item changed since you opened it. Refresh the inbox and try again.");
  }
  const updated = await prisma.voiceReviewItem.findUniqueOrThrow({
    where: { id: input.reviewItem.id },
  });

  await recordTransition({
    organizationId: input.ctx.organizationId,
    reviewItemId: input.reviewItem.id,
    branchId: input.ctx.branchId,
    requestId: input.reviewItem.sourceId,
    providerCallId: input.reviewItem.providerCallId,
    actorUserId: input.ctx.userId,
    actorRole: input.ctx.role,
    previousStatus,
    newStatus: input.nextStatus,
    reason: input.reason,
    metadata: input.metadata,
  });

  await updateSourceStatus(input.reviewItem.sourceType as ReviewSourceType, input.reviewItem.sourceId, input.nextStatus);
  return updated;
}

async function createOutcomeLink(input: {
  organizationId: string;
  branchId: string;
  reviewItemId: string;
  sourceType: ReviewSourceType;
  sourceId: string;
  outcomeType: string;
  outcomeId?: string | null;
  customerId?: string | null;
  providerCallId?: string | null;
  approvingUserId?: string | null;
  idempotencyKey: string;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.voiceOutcomeLink.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    update: {},
    create: {
      organizationId: input.organizationId,
      branchId: input.branchId,
      reviewItemId: input.reviewItemId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      outcomeType: input.outcomeType,
      outcomeId: input.outcomeId || null,
      customerId: input.customerId || null,
      providerCallId: input.providerCallId || null,
      approvingUserId: input.approvingUserId || null,
      idempotencyKey: input.idempotencyKey,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

function getScopedDb(ctx: TenantContext) {
  return getTenantStore(ctx);
}

async function getScopedReviewItem(input: ReviewActionContext) {
  const reviewItem = await prisma.voiceReviewItem.findFirst({
    where: {
      id: input.reviewItemId,
      organizationId: input.ctx.organizationId,
      branchId: input.ctx.branchId,
    },
  });
  if (!reviewItem) {
    throw new Error("Voice review item not found.");
  }
  if (reviewItem.version !== input.expectedVersion) {
    throw new Error("This review item changed since you opened it. Refresh the inbox and try again.");
  }
  return reviewItem;
}

async function resolveApprovedCustomer(db: ScopedPrisma, reviewItem: ReviewListItem, identity: VoiceCustomerIdentity) {
  return resolveVoiceCustomer(db, identity, {
    marketKey: reviewItem.marketKey === "uk" || reviewItem.marketKey === "pk" ? reviewItem.marketKey : null,
  });
}

export async function approveVoiceLeadCustomer(input: {
  ctx: TenantContext;
  reviewItemId: string;
  expectedVersion: number;
  customerIdentity: VoiceCustomerIdentity;
}) {
  const reviewItem = await getScopedReviewItem(input);
  const idempotencyKey = buildVoiceErpIdempotencyKey({
    organizationId: input.ctx.organizationId,
    branchId: input.ctx.branchId,
    providerCallId: reviewItem.providerCallId,
    requestId: reviewItem.sourceId,
    outcomeType: "customer",
  });
  const existingOutcome = await getVoiceOutcomeByIdempotencyKey(input.ctx.organizationId, idempotencyKey);
  if (existingOutcome?.customerId) {
    return {
      status: "completed" as const,
      customerId: existingOutcome.customerId,
      idempotencyKey,
      duplicatedFromOutcome: true,
    };
  }

  const approved = await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem,
    expectedVersion: input.expectedVersion,
    nextStatus: "approved",
    reason: "Staff approved customer resolution.",
  });
  const processing = await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem: approved,
    expectedVersion: approved.version,
    nextStatus: "processing",
    reason: "Customer resolution started.",
  });

  const db = getScopedDb(input.ctx);
  const result = await resolveApprovedCustomer(db, processing, {
    ...input.customerIdentity,
    customerConfirmed: true,
  });

  if (result.status === "needs_information" || result.status === "conflict") {
    await transitionReviewItemStatus({
      ctx: input.ctx,
      reviewItem: processing,
      expectedVersion: processing.version,
      nextStatus: "needs_information",
      reason: result.reason,
      metadata: result,
    });
    return result;
  }
  await createOutcomeLink({
    organizationId: input.ctx.organizationId,
    branchId: input.ctx.branchId,
    reviewItemId: processing.id,
    sourceType: processing.sourceType as ReviewSourceType,
    sourceId: processing.sourceId,
    outcomeType: "customer",
    outcomeId: result.customerId,
    customerId: result.customerId,
    providerCallId: processing.providerCallId,
    approvingUserId: input.ctx.userId,
    idempotencyKey,
    metadata: result,
  });

  await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem: processing,
    expectedVersion: processing.version,
    nextStatus: "completed",
    reason: "Customer resolution completed.",
    metadata: result,
  });
  await writeAuditLog(input.ctx, "voice_review_customer_approved", "VoiceReviewItem", processing.id, JSON.stringify(result));
  await logVoiceAction({
    organizationId: input.ctx.organizationId,
    actorUserId: input.ctx.userId,
    actorRole: input.ctx.role,
    action: "VOICE_REVIEW_CUSTOMER_APPROVED",
    summary: `Approved customer resolution for ${processing.sourceType}:${processing.sourceId}`,
    metadataJson: JSON.stringify(result),
  });

  return result;
}

export async function approveVoiceOrderDraft(input: {
  ctx: TenantContext;
  reviewItemId: string;
  expectedVersion: number;
  customerIdentity: VoiceCustomerIdentity;
  lines: Array<{ productId: string; quantity: number }>;
  notes?: string | null;
}) {
  const reviewItem = await getScopedReviewItem(input);
  if (!reviewItem || reviewItem.sourceType !== "VoiceOrderRequest") {
    throw new Error("Voice order review item not found.");
  }
  if (input.lines.length === 0) {
    throw new Error("At least one approved product line is required.");
  }
  const idempotencyKey = buildVoiceErpIdempotencyKey({
    organizationId: input.ctx.organizationId,
    branchId: input.ctx.branchId,
    providerCallId: reviewItem.providerCallId,
    requestId: reviewItem.sourceId,
    outcomeType: "order",
  });
  const existingOutcome = await getVoiceOutcomeByIdempotencyKey(input.ctx.organizationId, idempotencyKey);
  if (existingOutcome?.outcomeId) {
    const existingInvoice = await getScopedDb(input.ctx).salesInvoice.findFirst({
      where: { id: existingOutcome.outcomeId },
      select: { id: true, invoiceNumber: true, customerId: true },
    });
    if (existingInvoice) {
      return {
        status: "completed" as const,
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoiceNumber,
        customerId: existingInvoice.customerId,
        duplicatedFromOutcome: true,
      };
    }
  }

  const approved = await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem,
    expectedVersion: input.expectedVersion,
    nextStatus: "approved",
    reason: "Staff approved order conversion.",
  });
  const processing = await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem: approved,
    expectedVersion: approved.version,
    nextStatus: "processing",
    reason: "Order conversion started.",
  });

  const db = getScopedDb(input.ctx);
  const customer = await resolveApprovedCustomer(db, processing, {
    ...input.customerIdentity,
    customerConfirmed: true,
  });
  if (customer.status === "needs_information" || customer.status === "conflict") {
    await transitionReviewItemStatus({
      ctx: input.ctx,
      reviewItem: processing,
      expectedVersion: processing.version,
      nextStatus: "needs_information",
      reason: customer.reason,
      metadata: customer,
    });
    return customer;
  }

  const source = await db.voiceOrderRequest.findFirst({ where: { id: reviewItem.sourceId } });
  if (!source) {
    throw new Error("Voice order request not found.");
  }

  const productIds = Array.from(new Set(input.lines.map((line) => line.productId)));
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, unitPrice: true },
  });
  if (products.length !== productIds.length) {
    throw new Error("One or more approved products were not found in this tenant.");
  }

  const availability = await db.inventoryItem.findMany({
    where: { branchId: input.ctx.branchId, productId: { in: productIds } },
    select: { productId: true, quantity: true },
  });
  const quantityByProduct = new Map(availability.map((item) => [item.productId, item.quantity]));
  for (const line of input.lines) {
    if ((quantityByProduct.get(line.productId) ?? 0) < line.quantity) {
      throw new Error(`Product ${line.productId} is not available in the selected branch quantity.`);
    }
  }

  const draft = buildApprovedVoiceOrderDraft({
    requestId: source.id,
    marketKey: processing.marketKey as "uk" | "pk",
    customerId: customer.customerId,
    branchId: input.ctx.branchId,
    lines: input.lines.map((line) => {
      const product = products.find((item) => item.id === line.productId)!;
      return {
        productId: product.id,
        productName: product.name,
        quantity: line.quantity,
        unitPrice: product.unitPrice,
      };
    }),
    notes: input.notes ?? source.orderDetailsText,
  });

  const existingInvoice = await db.salesInvoice.findFirst({
    where: { invoiceNumber: draft.invoiceNumber },
    include: { items: true },
  });
  const invoice =
    existingInvoice ??
    (await db.salesInvoice.create({
      data: {
        organizationId: input.ctx.organizationId,
        branchId: input.ctx.branchId,
        customerId: draft.customerId,
        invoiceNumber: draft.invoiceNumber,
        status: "DRAFT",
        subtotal: draft.subtotal,
        discount: draft.discount,
        taxAmount: draft.taxAmount,
        totalAmount: draft.totalAmount,
        notes: draft.notes,
        items: {
          create: draft.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            total: line.total,
          })),
        },
      },
      include: { items: true },
    }));

  await createOutcomeLink({
    organizationId: input.ctx.organizationId,
    branchId: input.ctx.branchId,
    reviewItemId: processing.id,
    sourceType: "VoiceOrderRequest",
    sourceId: processing.sourceId,
    outcomeType: "SalesInvoiceDraft",
    outcomeId: invoice.id,
    customerId: customer.customerId,
    providerCallId: processing.providerCallId,
    approvingUserId: input.ctx.userId,
    idempotencyKey,
    metadata: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount },
  });

  await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem: processing,
    expectedVersion: processing.version,
    nextStatus: "completed",
    reason: "Draft order created.",
    metadata: { invoiceId: invoice.id, customerId: customer.customerId },
  });
  await writeAuditLog(input.ctx, "voice_review_order_approved", "SalesInvoice", invoice.id, `Draft from voice request ${processing.sourceId}`);
  return { status: "completed", invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, customerId: customer.customerId };
}

export async function approveVoiceBooking(input: {
  ctx: TenantContext;
  reviewItemId: string;
  expectedVersion: number;
  customerIdentity: VoiceCustomerIdentity;
  requestedStartAt: string;
  bookingType?: string | null;
  notes?: string | null;
}) {
  const reviewItem = await getScopedReviewItem(input);
  if (!reviewItem || reviewItem.sourceType !== "VoiceReservationRequest") {
    throw new Error("Voice booking review item not found.");
  }
  const idempotencyKey = buildVoiceErpIdempotencyKey({
    organizationId: input.ctx.organizationId,
    branchId: input.ctx.branchId,
    providerCallId: reviewItem.providerCallId,
    requestId: reviewItem.sourceId,
    outcomeType: "booking",
  });
  const existingOutcome = await getVoiceOutcomeByIdempotencyKey(input.ctx.organizationId, idempotencyKey);
  if (existingOutcome?.outcomeId) {
    const existingBooking = await getScopedDb(input.ctx).voiceBooking.findFirst({
      where: { id: existingOutcome.outcomeId },
      select: { id: true, customerId: true },
    });
    if (existingBooking) {
      return {
        status: "completed" as const,
        bookingId: existingBooking.id,
        customerId: existingBooking.customerId,
        duplicatedFromOutcome: true,
      };
    }
  }

  const approved = await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem,
    expectedVersion: input.expectedVersion,
    nextStatus: "approved",
    reason: "Staff approved booking conversion.",
  });
  const processing = await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem: approved,
    expectedVersion: approved.version,
    nextStatus: "processing",
    reason: "Booking conversion started.",
  });

  const db = getScopedDb(input.ctx);
  const customer = await resolveApprovedCustomer(db, processing, {
    ...input.customerIdentity,
    customerConfirmed: true,
  });
  if (customer.status === "needs_information" || customer.status === "conflict") {
    await transitionReviewItemStatus({
      ctx: input.ctx,
      reviewItem: processing,
      expectedVersion: processing.version,
      nextStatus: "needs_information",
      reason: customer.reason,
      metadata: customer,
    });
    return customer;
  }

  const startAt = parseRequestedBookingDateTime(input.requestedStartAt, processing.timezone);
  const existing = await db.voiceBooking.findMany({
    where: { branchId: input.ctx.branchId, scheduledStartAt: { gte: new Date(startAt.getTime() - 60 * 60 * 1000), lte: new Date(startAt.getTime() + 60 * 60 * 1000) } },
    select: { scheduledStartAt: true, scheduledEndAt: true, status: true },
  });
  assertVoiceBookingAvailability({ requestedStartAt: startAt, existingBookings: existing });

  const existingBooking = await db.voiceBooking.findFirst({ where: { idempotencyKey } });
  const booking =
    existingBooking ??
    (await db.voiceBooking.create({
      data: {
        organizationId: input.ctx.organizationId,
        branchId: input.ctx.branchId,
        customerId: customer.customerId,
        sourceReviewItemId: processing.id,
        sourceRequestId: processing.sourceId,
        providerCallId: processing.providerCallId,
        bookingType: input.bookingType || "APPOINTMENT",
        status: "CONFIRMED",
        scheduledStartAt: startAt,
        timezone: processing.timezone,
        customerNameSnapshot: input.customerIdentity.name || null,
        customerPhoneSnapshot: input.customerIdentity.phone || null,
        notes: input.notes || null,
        idempotencyKey,
      },
    }));

  await createOutcomeLink({
    organizationId: input.ctx.organizationId,
    branchId: input.ctx.branchId,
    reviewItemId: processing.id,
    sourceType: "VoiceReservationRequest",
    sourceId: processing.sourceId,
    outcomeType: "VoiceBooking",
    outcomeId: booking.id,
    customerId: customer.customerId,
    providerCallId: processing.providerCallId,
    approvingUserId: input.ctx.userId,
    idempotencyKey,
    metadata: { scheduledStartAt: booking.scheduledStartAt.toISOString(), timezone: booking.timezone },
  });

  await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem: processing,
    expectedVersion: processing.version,
    nextStatus: "completed",
    reason: "Booking created.",
    metadata: { bookingId: booking.id, customerId: customer.customerId },
  });
  await writeAuditLog(input.ctx, "voice_review_booking_approved", "VoiceBooking", booking.id, `Booking from voice request ${processing.sourceId}`);
  return { status: "completed", bookingId: booking.id, customerId: customer.customerId };
}

export async function setVoiceReviewStatus(input: {
  ctx: TenantContext;
  reviewItemId: string;
  expectedVersion: number;
  nextStatus: VoiceReviewStatus;
  reason?: string | null;
}) {
  const reviewItem = await getScopedReviewItem(input);
  const updated = await transitionReviewItemStatus({
    ctx: input.ctx,
    reviewItem,
    expectedVersion: input.expectedVersion,
    nextStatus: input.nextStatus,
    reason: input.reason,
  });
  await writeAuditLog(input.ctx, `voice_review_${input.nextStatus}`, "VoiceReviewItem", reviewItem.id, input.reason || undefined);
  return updated;
}

export async function getVoiceOutcomeByIdempotencyKey(organizationId: string, idempotencyKey: string) {
  return prisma.voiceOutcomeLink.findFirst({
    where: { organizationId, idempotencyKey },
  });
}
