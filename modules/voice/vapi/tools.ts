// modules/voice/vapi/tools.ts

import { prisma } from "@/lib/prisma";
import { getVoiceTrainingRuntime } from "@/modules/voice/training/service";

type VapiToolContext = {
  voiceAgentId?: string | null;
  providerCallId?: string | null;
  callerNumber?: string | null;
  providerAssistantId?: string | null;
  providerPhoneNumberId?: string | null;
};

const ORDER_REASON_DEFAULT = "Takeaway order request";
const HANDOFF_REASON_DEFAULT = "Human callback request";

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeScalarText(value: unknown) {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function buildLeadNotes(args: Record<string, unknown>, existingNotes?: string) {
  const details = [
    normalizeText(args.notes),
    normalizeText(args.specialRequests) ? `Special requests: ${args.specialRequests}` : undefined,
    normalizeScalarText(args.partySize) ? `Party size: ${normalizeScalarText(args.partySize)}` : undefined,
    normalizeScalarText(args.date) ? `Requested date: ${normalizeScalarText(args.date)}` : undefined,
    normalizeScalarText(args.time) ? `Requested time: ${normalizeScalarText(args.time)}` : undefined,
    normalizeScalarText(args.preferredTime) ? `Preferred time: ${normalizeScalarText(args.preferredTime)}` : undefined,
    normalizeText(args.menuQuestion) ? `Menu question: ${args.menuQuestion}` : undefined,
    normalizeText(args.orderRequest) ? `Order request: ${args.orderRequest}` : undefined,
    normalizeScalarText(args.items) ? `Items: ${normalizeScalarText(args.items)}` : undefined,
    normalizeScalarText(args.quantity) ? `Quantity: ${normalizeScalarText(args.quantity)}` : undefined,
    normalizeText(args.pickupOrDelivery) ? `Pickup/Delivery: ${args.pickupOrDelivery}` : undefined,
    normalizeText(args.deliveryPreference) ? `Pickup/Delivery: ${args.deliveryPreference}` : undefined,
    normalizeText(args.allergies) ? `Allergies: ${args.allergies}` : undefined,
    normalizeText(args.handoffReason) ? `Handoff reason: ${args.handoffReason}` : undefined,
  ].filter(Boolean);

  if (existingNotes) {
    details.unshift(existingNotes);
  }

  return details.length > 0 ? details.join("\n") : undefined;
}

async function attachCallMetadata(
  organizationId: string,
  context: VapiToolContext,
  data: {
    summary?: string | null;
    transcript?: string | null;
    durationSeconds?: number | null;
    appointmentRequested?: boolean;
    callStatus?: string;
  },
) {
  if (!context.providerCallId && !context.callerNumber) {
    return;
  }

  const existing = context.providerCallId
    ? await prisma.voiceCallLog.findFirst({
        where: { organizationId, providerCallId: context.providerCallId },
      })
    : await prisma.voiceCallLog.findFirst({
        where: { organizationId, callerNumber: context.callerNumber ?? "" },
        orderBy: { createdAt: "desc" },
      });

  const baseData = {
    provider: "vapi",
    voiceAgentId: context.voiceAgentId || existing?.voiceAgentId || null,
    providerCallId: context.providerCallId || existing?.providerCallId || null,
    providerAssistantId: context.providerAssistantId || existing?.providerAssistantId || null,
    providerPhoneNumberId: context.providerPhoneNumberId || existing?.providerPhoneNumberId || null,
    callerNumber: context.callerNumber || existing?.callerNumber || "Unknown",
    callDirection: existing?.callDirection || "INBOUND",
    callStatus: data.callStatus || existing?.callStatus || "COMPLETED",
    summary: data.summary ?? existing?.summary ?? null,
    transcript: data.transcript ?? existing?.transcript ?? null,
    transcriptPlaceholder: existing?.transcriptPlaceholder ?? null,
    durationSeconds: data.durationSeconds ?? existing?.durationSeconds ?? null,
    appointmentRequested: data.appointmentRequested ?? existing?.appointmentRequested ?? false,
    isMissed: (data.callStatus || existing?.callStatus) === "MISSED",
    startedAt: existing?.startedAt || new Date(),
    endedAt: data.callStatus === "COMPLETED" || data.callStatus === "MISSED" ? new Date() : existing?.endedAt || null,
  };

  if (existing) {
    await prisma.voiceCallLog.update({
      where: { id: existing.id },
      data: baseData,
    });
    return;
  }

  await prisma.voiceCallLog.create({
    data: {
      organizationId,
      ...baseData,
    },
  });
}

export async function handleToolCall(
  toolName: string,
  args: Record<string, unknown> | string | undefined,
  organizationId: string,
  context: VapiToolContext = {},
): Promise<Record<string, unknown>> {
  const safeArgs =
    typeof args === "string"
      ? (() => {
          try {
            return JSON.parse(args) as Record<string, unknown>;
          } catch {
            return {};
          }
        })()
      : (args ?? {});

  try {
    switch (toolName) {
      case "capture_lead":
        return await captureLead(safeArgs, organizationId, context);
      case "request_appointment":
        return await requestAppointment(safeArgs, organizationId, context);
      case "create_order_request":
        return await createOrderRequest(safeArgs, organizationId, context);
      case "lookup_faq":
        return await lookupFaq(safeArgs, organizationId);
      case "get_business_hours":
        return await getBusinessHours(organizationId);
      case "get_fallback_contact":
        return await getFallbackContact(organizationId);
      case "summarize_call":
        return await summarizeCall(safeArgs, organizationId, context);
      case "handoff_to_staff":
        return await handoffToStaff(safeArgs, organizationId, context);
      default:
        return {
          success: false,
          error: `Tool ${toolName} is not supported in this demo.`,
        };
    }
  } catch (error) {
    console.error(`[Vapi Tools] Error executing ${toolName}:`, error);
    return {
      success: false,
      error: "The receptionist could not complete that step right now, but the call can continue safely.",
    };
  }
}

async function captureLead(args: Record<string, unknown>, organizationId: string, context: VapiToolContext) {
  const name = normalizeText(args.name);
  const phone = normalizeText(args.phone) || normalizeText(args.phoneNumber) || context.callerNumber || undefined;
  const email = normalizeText(args.email);
  const reasonForCall =
    normalizeText(args.reasonForCall) ||
    normalizeText(args.reason) ||
    normalizeText(args.requestType) ||
    "General inquiry";
  const notes = buildLeadNotes(args);

  if (!name && !phone && !email) {
    return {
      success: false,
      error: "At least a name, phone number, or email is required to save the caller request.",
    };
  }

  const lead = await prisma.voiceLead.create({
    data: {
      organizationId,
      voiceAgentId: context.voiceAgentId || null,
      name: name || null,
      phone: phone || null,
      email: email || null,
      reasonForCall,
      notes: notes || null,
      source: "VAPI_LEAD_CAPTURE",
      status: "NEW",
    },
  });

  await attachCallMetadata(organizationId, context, {
    appointmentRequested: false,
    summary: `Lead captured for ${name || phone || email || "caller"}`,
    callStatus: "COMPLETED",
  });

  return {
    success: true,
    leadId: lead.id,
    message: "Lead captured successfully. Let the caller know the team will follow up.",
  };
}

async function requestAppointment(args: Record<string, unknown>, organizationId: string, context: VapiToolContext) {
  const runtime = await getVoiceTrainingRuntime(organizationId);
  const bookingAllowed =
    runtime.bookingRules.acceptsBookings &&
    (runtime.actionPolicy.allowedActions.includes("CREATE_TABLE_BOOKING_REQUEST") ||
      runtime.actionPolicy.allowedActions.includes("CREATE_APPOINTMENT_REQUEST"));

  if (!bookingAllowed) {
    return {
      success: false,
      error: runtime.bookingRules.fallbackMessage || "This business is not currently accepting booking requests through the receptionist.",
    };
  }

  const name = normalizeText(args.name);
  const phone = normalizeText(args.phone) || normalizeText(args.phoneNumber) || context.callerNumber || undefined;
  const email = normalizeText(args.email);
  const partySize = normalizeScalarText(args.partySize);
  const date = normalizeScalarText(args.date);
  const time = normalizeScalarText(args.time) || normalizeScalarText(args.preferredTime);
  const reasonForCall =
    normalizeText(args.reasonForCall) ||
    normalizeText(args.reason) ||
    "Table booking request";
  const notes = buildLeadNotes(args, "Team confirmation required. Do not treat this as a confirmed booking.");

  const requestedFieldValues: Record<string, string | undefined> = {
    name,
    phone,
    date,
    time,
    party_size_or_service_type: partySize || normalizeText(args.serviceType),
    notes: normalizeText(args.notes),
  };

  const missingFields = runtime.bookingRules.requiredFields.filter((field) => !requestedFieldValues[field]);
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Missing required booking details: ${missingFields.join(", ").replaceAll("_", " ")}.`,
    };
  }

  const lead = await prisma.voiceLead.create({
    data: {
      organizationId,
      voiceAgentId: context.voiceAgentId || null,
      name: name || null,
      phone: phone || null,
      email: email || null,
      reasonForCall,
      notes: notes || null,
      appointmentRequested: true,
      source: "VAPI_TABLE_REQUEST",
      status: "NEW",
    },
  });

  await attachCallMetadata(organizationId, context, {
    appointmentRequested: true,
    summary: `Booking request saved for ${name || phone || "caller"}${partySize ? `, party of ${partySize}` : ""}${date || time ? ` on ${[date, time].filter(Boolean).join(" at ")}` : ""}`,
    callStatus: "COMPLETED",
  });

  return {
    success: true,
    leadId: lead.id,
    message:
      runtime.bookingRules.confirmationMessage ||
      "The booking request has been saved. Tell the caller the team will confirm availability.",
  };
}

async function createOrderRequest(args: Record<string, unknown>, organizationId: string, context: VapiToolContext) {
  const runtime = await getVoiceTrainingRuntime(organizationId);
  const orderAllowed =
    runtime.orderRules.acceptsOrderRequests && runtime.actionPolicy.allowedActions.includes("CREATE_ORDER_REQUEST");

  if (!orderAllowed) {
    return {
      success: false,
      error: "This business is not currently accepting order requests through the receptionist.",
    };
  }

  const name = normalizeText(args.name);
  const phone = normalizeText(args.phone) || normalizeText(args.phoneNumber) || context.callerNumber || undefined;
  const email = normalizeText(args.email);
  const items =
    normalizeScalarText(args.items) ||
    normalizeScalarText(args.orderItems) ||
    normalizeScalarText(args.orderRequest);
  const preferredTime = normalizeScalarText(args.preferredTime) || normalizeScalarText(args.time);
  const pickupOrDelivery =
    normalizeText(args.pickupOrDelivery) ||
    normalizeText(args.deliveryPreference) ||
    normalizeText(args.fulfillmentType);
  const reasonForCall =
    normalizeText(args.reasonForCall) ||
    normalizeText(args.reason) ||
    ORDER_REASON_DEFAULT;
  const notes = buildLeadNotes(
    args,
    "Team confirmation required. Do not treat this as a confirmed order and do not create ERP transactions.",
  );

  if (!name && !phone) {
    return {
      success: false,
      error: "A caller name or phone number is required before saving an order request.",
    };
  }

  if (!items) {
    return {
      success: false,
      error: "Order items are required before saving an order request.",
    };
  }

  const requestedFieldValues: Record<string, string | undefined> = {
    name,
    phone,
    items,
    quantities: normalizeScalarText(args.quantity) || normalizeScalarText(args.quantities),
    pickup_or_delivery: pickupOrDelivery,
    preferred_time: preferredTime,
    delivery_address: normalizeText(args.deliveryAddress),
    notes_or_allergies: normalizeText(args.notes) || normalizeText(args.allergies),
  };

  const missingFields = runtime.orderRules.requiredFields.filter((field) => !requestedFieldValues[field]);
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Missing required order details: ${missingFields.join(", ").replaceAll("_", " ")}.`,
    };
  }

  const lead = await prisma.voiceLead.create({
    data: {
      organizationId,
      voiceAgentId: context.voiceAgentId || null,
      name: name || null,
      phone: phone || null,
      email: email || null,
      reasonForCall,
      notes: notes || null,
      source: "VAPI_ORDER_REQUEST",
      status: "NEW",
    },
  });

  await attachCallMetadata(organizationId, context, {
    summary: `Order request saved for ${name || phone || "caller"}${pickupOrDelivery ? ` (${pickupOrDelivery})` : ""}${preferredTime ? ` at ${preferredTime}` : ""}`,
    callStatus: "COMPLETED",
  });

  return {
    success: true,
    leadId: lead.id,
    message:
      runtime.orderRules.confirmationWording ||
      "The order request has been saved. Tell the caller the team will confirm the details before preparing it.",
  };
}

async function lookupFaq(args: Record<string, unknown>, organizationId: string) {
  const query = normalizeText(args.query) || normalizeText(args.question);
  if (!query) {
    return {
      success: false,
      found: false,
      message: "A question or query is required for the FAQ lookup.",
    };
  }

  const items = await prisma.voiceKnowledgeBaseItem.findMany({
    where: {
      organizationId,
      isActive: true,
      OR: [
        { question: { contains: query, mode: "insensitive" } },
        { answer: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 3,
  });

  if (items.length === 0) {
    return {
      success: true,
      found: false,
      message: "No exact answer found in the business knowledge base.",
    };
  }

  return {
    success: true,
    found: true,
    answers: items.map((item) => ({
      question: item.question,
      answer: item.answer,
      category: item.category,
    })),
  };
}

async function getBusinessHours(organizationId: string) {
  const runtime = await getVoiceTrainingRuntime(organizationId);

  return {
    success: true,
    businessHours: runtime.businessIdentity.openingHours || "Business hours are not configured yet.",
  };
}

async function getFallbackContact(organizationId: string) {
  const runtime = await getVoiceTrainingRuntime(organizationId);

  return {
    success: true,
    fallbackContact:
      runtime.handoffRules.fallbackPhone ||
      runtime.handoffRules.fallbackEmail ||
      runtime.businessIdentity.fallbackContactMethod ||
      runtime.businessIdentity.businessPhone ||
      "A team member will follow up directly.",
  };
}

async function summarizeCall(args: Record<string, unknown>, organizationId: string, context: VapiToolContext) {
  const summary = normalizeText(args.summary) || normalizeText(args.callSummary) || "Call completed";
  const transcript = normalizeText(args.transcript);
  const durationRaw = args.durationSeconds ?? args.duration;
  const durationSeconds =
    typeof durationRaw === "number"
      ? durationRaw
      : typeof durationRaw === "string" && durationRaw.trim().length > 0
        ? Number(durationRaw)
        : null;

  await attachCallMetadata(organizationId, context, {
    summary,
    transcript,
    durationSeconds: Number.isFinite(durationSeconds as number) ? (durationSeconds as number) : null,
    appointmentRequested: Boolean(args.appointmentRequested),
    callStatus: "COMPLETED",
  });

  return {
    success: true,
    message: "Call summary stored safely.",
  };
}

async function handoffToStaff(args: Record<string, unknown>, organizationId: string, context: VapiToolContext) {
  const runtime = await getVoiceTrainingRuntime(organizationId);
  const handoffAllowed = runtime.actionPolicy.allowedActions.includes("HANDOFF_TO_STAFF");

  if (!handoffAllowed) {
    return {
      success: false,
      error: "Human handoff is not enabled for this business.",
    };
  }

  const name = normalizeText(args.name);
  const phone = normalizeText(args.phone) || normalizeText(args.phoneNumber) || context.callerNumber || undefined;
  const email = normalizeText(args.email);
  const reasonForCall =
    normalizeText(args.reasonForCall) ||
    normalizeText(args.reason) ||
    normalizeText(args.handoffReason) ||
    HANDOFF_REASON_DEFAULT;
  const notes = buildLeadNotes(
    args,
    "Customer requested human follow-up. No outbound call or external message was triggered automatically.",
  );

  if (!name && !phone && !email) {
    return {
      success: false,
      error: "A name, phone number, or email is required before requesting a staff handoff.",
    };
  }

  const lead = await prisma.voiceLead.create({
    data: {
      organizationId,
      voiceAgentId: context.voiceAgentId || null,
      name: name || null,
      phone: phone || null,
      email: email || null,
      reasonForCall,
      notes: notes || null,
      source: "VAPI_HANDOFF_REQUEST",
      status: "NEW",
    },
  });

  await attachCallMetadata(organizationId, context, {
    summary: `Human handoff request saved for ${name || phone || email || "caller"}`,
    callStatus: "COMPLETED",
  });

  return {
    success: true,
    leadId: lead.id,
    message:
      runtime.handoffRules.staffNotificationPlaceholder ||
      "The callback request has been saved. Tell the caller the team will follow up directly.",
  };
}
