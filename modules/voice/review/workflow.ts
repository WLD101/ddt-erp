export const voiceReviewStatuses = [
  "captured",
  "needs_information",
  "needs_staff_review",
  "approved",
  "processing",
  "completed",
  "rejected",
  "failed",
  "dead_lettered",
  "reversed",
] as const;

export type VoiceReviewStatus = (typeof voiceReviewStatuses)[number];

export const voiceReviewTransitionMap: Record<VoiceReviewStatus, VoiceReviewStatus[]> = {
  captured: ["needs_information", "needs_staff_review", "approved", "rejected", "dead_lettered"],
  needs_information: ["needs_staff_review", "approved", "rejected", "dead_lettered"],
  needs_staff_review: ["approved", "needs_information", "rejected", "dead_lettered"],
  approved: ["processing", "rejected", "failed"],
  processing: ["completed", "failed", "reversed"],
  completed: ["reversed"],
  rejected: ["needs_staff_review"],
  failed: ["needs_staff_review", "processing", "dead_lettered", "rejected"],
  dead_lettered: ["needs_staff_review"],
  reversed: [],
};

export function assertValidVoiceReviewTransition(previousStatus: VoiceReviewStatus, nextStatus: VoiceReviewStatus) {
  if (!voiceReviewTransitionMap[previousStatus].includes(nextStatus)) {
    throw new Error(`Invalid voice review transition: ${previousStatus} -> ${nextStatus}`);
  }
}

export function normalizeVoiceReviewStatus(value: string | null | undefined): VoiceReviewStatus {
  if (value && (voiceReviewStatuses as readonly string[]).includes(value)) {
    return value as VoiceReviewStatus;
  }

  return "captured";
}

export function deriveInitialVoiceReviewStatus(sourceType: "VoiceLead" | "VoiceOrderRequest" | "VoiceReservationRequest") {
  return sourceType === "VoiceLead" ? "captured" : "needs_staff_review";
}

export type VoiceReviewInvoiceLineCandidate = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export function buildApprovedVoiceOrderDraft(input: {
  requestId: string;
  marketKey: "uk" | "pk";
  customerId: string;
  branchId: string;
  lines: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
  discount?: number | null;
  taxAmount?: number | null;
  notes?: string | null;
}) {
  const lines = input.lines.map((line) => ({
    ...line,
    total: Number((line.quantity * line.unitPrice).toFixed(2)),
  }));
  const subtotal = Number(lines.reduce((sum, line) => sum + line.total, 0).toFixed(2));
  const discount = Number((input.discount ?? 0).toFixed(2));
  const taxAmount = Number((input.taxAmount ?? 0).toFixed(2));
  const totalAmount = Number(Math.max(0, subtotal - discount + taxAmount).toFixed(2));
  const invoiceNumber = `VOI-${input.marketKey.toUpperCase()}-${input.requestId.slice(-8).toUpperCase()}`;

  return {
    invoiceNumber,
    branchId: input.branchId,
    customerId: input.customerId,
    status: "DRAFT" as const,
    subtotal,
    discount,
    taxAmount,
    totalAmount,
    notes: input.notes ?? null,
    lines,
  };
}

export function parseRequestedBookingDateTime(value: string, timezone: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Requested booking date/time is required.");
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Could not parse booking date/time "${value}" for timezone ${timezone}.`);
  }

  return parsed;
}

export function assertVoiceBookingAvailability(input: {
  requestedStartAt: Date;
  existingBookings: Array<{ scheduledStartAt: Date; scheduledEndAt: Date | null; status: string }>;
}) {
  const requestedStartMs = input.requestedStartAt.getTime();
  for (const booking of input.existingBookings) {
    const existingStart = booking.scheduledStartAt.getTime();
    const existingEnd = booking.scheduledEndAt?.getTime() ?? existingStart + 60 * 60 * 1000;
    if (booking.status !== "CANCELLED" && requestedStartMs >= existingStart && requestedStartMs < existingEnd) {
      throw new Error("The requested booking slot is not available.");
    }
  }
}
