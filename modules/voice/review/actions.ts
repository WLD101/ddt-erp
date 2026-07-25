"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerAction } from "@/lib/actions/builder";
import {
  approveVoiceBooking,
  approveVoiceLeadCustomer,
  approveVoiceOrderDraft,
  setVoiceReviewStatus,
} from "@/modules/voice/review/service";

const voiceReviewPaths = [
  "/voice/dashboard/review",
  "/voice/dashboard/leads",
  "/voice/dashboard/orders",
  "/voice/dashboard/reservations",
  "/voice/dashboard/call-logs",
];

const customerIdentitySchema = z.object({
  name: z.string().trim().optional().transform((value) => value || undefined),
  phone: z.string().trim().optional().transform((value) => value || undefined),
  email: z.string().trim().email("A valid email is required.").optional().or(z.literal("")).transform((value) => value || undefined),
});

const reviewActionBaseSchema = z.object({
  reviewItemId: z.string().trim().min(1, "Review item is required."),
  expectedVersion: z.number().int().min(1, "Review version is required."),
});

const approveLeadSchema = reviewActionBaseSchema.extend({
  customerIdentity: customerIdentitySchema,
});

const approveOrderSchema = reviewActionBaseSchema.extend({
  customerIdentity: customerIdentitySchema,
  notes: z.string().trim().optional().transform((value) => value || undefined),
  lines: z
    .array(
      z.object({
        productId: z.string().trim().min(1, "Product is required."),
        quantity: z.number().positive("Quantity must be greater than zero."),
      }),
    )
    .min(1, "At least one approved product line is required."),
});

const approveBookingSchema = reviewActionBaseSchema.extend({
  customerIdentity: customerIdentitySchema,
  requestedStartAt: z.string().trim().min(1, "Requested booking date and time is required."),
  bookingType: z.string().trim().optional().transform((value) => value || undefined),
  notes: z.string().trim().optional().transform((value) => value || undefined),
});

const statusChangeSchema = reviewActionBaseSchema.extend({
  reason: z.string().trim().min(3, "Please add a short reason."),
});

function revalidateVoiceReviewPaths() {
  voiceReviewPaths.forEach((path) => revalidatePath(path));
}

export const approveVoiceLeadCustomerAction = createServerAction({
  label: "Approve Voice Lead Customer",
  schema: approveLeadSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_REVIEW_CUSTOMER_APPROVAL_SUBMITTED",
    entityType: "VoiceReviewItem",
    getEntityId: (result) => result.customerId || "voice-review-customer",
    getDetails: (input) => `Approved customer creation for voice review item ${input.reviewItemId}.`,
  },
  handler: async ({ input, context }) => {
    const result = await approveVoiceLeadCustomer({
      ctx: context.ctx,
      reviewItemId: input.reviewItemId,
      expectedVersion: input.expectedVersion,
      customerIdentity: input.customerIdentity,
    });
    revalidateVoiceReviewPaths();
    return result;
  },
});

export const approveVoiceOrderDraftAction = createServerAction({
  label: "Approve Voice Order Draft",
  schema: approveOrderSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_REVIEW_ORDER_APPROVAL_SUBMITTED",
    entityType: "VoiceReviewItem",
    getEntityId: (result) => result.invoiceId || "voice-review-order",
    getDetails: (input) => `Approved order conversion for voice review item ${input.reviewItemId}.`,
  },
  handler: async ({ input, context }) => {
    const result = await approveVoiceOrderDraft({
      ctx: context.ctx,
      reviewItemId: input.reviewItemId,
      expectedVersion: input.expectedVersion,
      customerIdentity: input.customerIdentity,
      lines: input.lines,
      notes: input.notes,
    });
    revalidateVoiceReviewPaths();
    return result;
  },
});

export const approveVoiceBookingAction = createServerAction({
  label: "Approve Voice Booking",
  schema: approveBookingSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  audit: {
    action: "VOICE_REVIEW_BOOKING_APPROVAL_SUBMITTED",
    entityType: "VoiceReviewItem",
    getEntityId: (result) => result.bookingId || "voice-review-booking",
    getDetails: (input) => `Approved booking conversion for voice review item ${input.reviewItemId}.`,
  },
  handler: async ({ input, context }) => {
    const result = await approveVoiceBooking({
      ctx: context.ctx,
      reviewItemId: input.reviewItemId,
      expectedVersion: input.expectedVersion,
      customerIdentity: input.customerIdentity,
      requestedStartAt: input.requestedStartAt,
      bookingType: input.bookingType,
      notes: input.notes,
    });
    revalidateVoiceReviewPaths();
    return result;
  },
});

export const rejectVoiceReviewAction = createServerAction({
  label: "Reject Voice Review",
  schema: statusChangeSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  handler: async ({ input, context }) => {
    const result = await setVoiceReviewStatus({
      ctx: context.ctx,
      reviewItemId: input.reviewItemId,
      expectedVersion: input.expectedVersion,
      nextStatus: "rejected",
      reason: input.reason,
    });
    revalidateVoiceReviewPaths();
    return result;
  },
});

export const requestVoiceReviewInformationAction = createServerAction({
  label: "Request Voice Review Information",
  schema: statusChangeSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  handler: async ({ input, context }) => {
    const result = await setVoiceReviewStatus({
      ctx: context.ctx,
      reviewItemId: input.reviewItemId,
      expectedVersion: input.expectedVersion,
      nextStatus: "needs_information",
      reason: input.reason,
    });
    revalidateVoiceReviewPaths();
    return result;
  },
});

export const assignVoiceReviewCallbackAction = createServerAction({
  label: "Assign Voice Review Callback",
  schema: statusChangeSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  handler: async ({ input, context }) => {
    const result = await setVoiceReviewStatus({
      ctx: context.ctx,
      reviewItemId: input.reviewItemId,
      expectedVersion: input.expectedVersion,
      nextStatus: "needs_staff_review",
      reason: `Callback assigned: ${input.reason}`,
    });
    revalidateVoiceReviewPaths();
    return result;
  },
});

export const retryVoiceReviewAction = createServerAction({
  label: "Retry Voice Review",
  schema: statusChangeSchema,
  roles: ["owner", "admin"],
  enforceBilling: false,
  handler: async ({ input, context }) => {
    const result = await setVoiceReviewStatus({
      ctx: context.ctx,
      reviewItemId: input.reviewItemId,
      expectedVersion: input.expectedVersion,
      nextStatus: "needs_staff_review",
      reason: `Retry queued: ${input.reason}`,
    });
    revalidateVoiceReviewPaths();
    return result;
  },
});
