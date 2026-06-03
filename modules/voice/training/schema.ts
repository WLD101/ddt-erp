import { z } from "zod";
import { voiceFallbackContactOptions } from "@/modules/voice/schema";

export const voiceTrainingLanguageOptions = ["ENGLISH", "URDU", "ROMAN_URDU", "AUTO_DETECT"] as const;
export const voiceTrainingToneOptions = ["PROFESSIONAL", "FRIENDLY", "PAKISTANI_POLITE", "LUXURY", "CASUAL"] as const;
export const voiceAfterHoursBehaviorOptions = [
  "TAKE_MESSAGE",
  "CALLBACK_REQUEST",
  "EMERGENCY_TRANSFER_PLACEHOLDER",
  "SAY_CLOSED_AND_COLLECT_DETAILS",
] as const;
export const voiceBookingTypeOptions = ["TABLE_BOOKING", "APPOINTMENT", "CALLBACK", "CONSULTATION"] as const;
export const voiceBookingModeOptions = ["REQUEST_ONLY", "AUTO_CONFIRM_IF_BACKEND_SUPPORTED", "STAFF_CONFIRMATION_REQUIRED"] as const;
export const voiceOrderModeOptions = ["REQUEST_ONLY", "DRAFT_ONLY", "STAFF_CONFIRMATION_REQUIRED"] as const;
export const voiceOrderTypeOptions = ["DINE_IN", "TAKEAWAY", "DELIVERY"] as const;
export const voiceBookingRequiredFieldOptions = ["name", "phone", "date", "time", "party_size_or_service_type", "notes"] as const;
export const voiceOrderRequiredFieldOptions = [
  "name",
  "phone",
  "items",
  "quantities",
  "pickup_or_delivery",
  "preferred_time",
  "delivery_address",
  "notes_or_allergies",
] as const;
export const voiceHandoffTriggerOptions = [
  "ANGRY_CUSTOMER",
  "PRICING_DISPUTE",
  "REFUND",
  "COMPLEX_BOOKING",
  "ORDER_ISSUE",
  "MEDICAL_LEGAL_FINANCIAL_QUESTION",
  "UNKNOWN_ANSWER",
] as const;
export const voiceAllowedActionOptions = [
  "ANSWER_FAQS",
  "CAPTURE_LEADS",
  "CREATE_CALLBACK_REQUEST",
  "CREATE_TABLE_BOOKING_REQUEST",
  "CREATE_APPOINTMENT_REQUEST",
  "CREATE_ORDER_REQUEST",
  "SUMMARIZE_CALL",
  "HANDOFF_TO_STAFF",
  "ERP_WRITES_DISABLED_UNLESS_PACKAGE_ALLOWS",
] as const;
export const voiceBlockedActionOptions = [
  "TAKE_PAYMENTS",
  "CONFIRM_PAID_ORDERS",
  "ISSUE_REFUNDS",
  "CANCEL_BOOKINGS",
  "CREATE_INVOICES",
  "DELETE_RECORDS",
  "CHANGE_ERP_FINANCIAL_DATA",
  "GIVE_MEDICAL_LEGAL_FINANCIAL_ADVICE",
  "PROMISE_DELIVERY_TIME_WITHOUT_CONFIGURED_RULE",
] as const;

const optionalText = z.string().trim().optional().or(z.literal(""));
const requiredText = (message: string, min = 2) => z.string().trim().min(min, message);
const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().min(min).max(max).optional(),
  );
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || /^https?:\/\//i.test(value), "Website must start with http:// or https://");

export const voiceTrainingProfileSchema = z.object({
  businessName: requiredText("Business name is required."),
  industry: requiredText("Industry is required."),
  locationCity: requiredText("Location or city is required."),
  shortDescription: requiredText("A short business description is required.", 8),
  primaryLanguage: z.enum(voiceTrainingLanguageOptions),
  supportedLanguages: z.array(z.enum(voiceTrainingLanguageOptions)).min(1, "Select at least one supported language."),
  tone: z.enum(voiceTrainingToneOptions),
  greetingMessage: requiredText("Greeting message is required.", 8),
  closingMessage: requiredText("Closing message is required.", 8),
  website: optionalUrl,
  businessPhone: requiredText("Business phone is required.", 5),
  openingHours: requiredText("Business hours are required.", 5),
  mainGoal: requiredText("Main goal is required."),
  fallbackContactMethod: z.enum(voiceFallbackContactOptions),
  holidayClosures: optionalText,
});

export const voiceServiceItemSchema = z.object({
  id: optionalText,
  name: requiredText("Service or menu item name is required."),
  category: optionalText,
  description: optionalText,
  pricePlaceholder: optionalText,
  availability: optionalText,
  notes: optionalText,
  takeawayAvailable: z.boolean().default(false),
  deliveryAvailable: z.boolean().default(false),
  dineInAvailable: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const deleteVoiceServiceItemSchema = z.object({
  id: requiredText("Service item is required.", 1),
});

export const voiceBookingRulesSchema = z.object({
  acceptsBookings: z.boolean().default(false),
  bookingType: z.enum(voiceBookingTypeOptions),
  bookingMode: z.enum(voiceBookingModeOptions),
  requiredFields: z.array(z.enum(voiceBookingRequiredFieldOptions)),
  maxPartySize: optionalInt(1, 500),
  bookingDurationMinutes: optionalInt(5, 24 * 60),
  advanceBookingLimitHours: optionalInt(1, 24 * 365),
  confirmationMessage: optionalText,
  fallbackMessage: optionalText,
}).superRefine((value, ctx) => {
  if (value.bookingMode === "AUTO_CONFIRM_IF_BACKEND_SUPPORTED") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bookingMode"],
      message: "Auto-confirm is blocked until backend booking confirmation is implemented.",
    });
  }
});

export const voiceOrderRulesSchema = z.object({
  acceptsOrderRequests: z.boolean().default(false),
  orderMode: z.enum(voiceOrderModeOptions),
  orderTypes: z.array(z.enum(voiceOrderTypeOptions)),
  requiredFields: z.array(z.enum(voiceOrderRequiredFieldOptions)),
  allergyDisclaimer: optionalText,
  confirmationWording: optionalText,
}).superRefine((value, ctx) => {
  if (value.orderMode === "DRAFT_ONLY") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["orderMode"],
      message: "Draft order mode is blocked until backend order drafting is implemented.",
    });
  }
});

export const voiceHandoffRulesSchema = z.object({
  fallbackPhone: optionalText,
  fallbackEmail: optionalText,
  staffNotificationPlaceholder: optionalText,
  handoffTriggers: z.array(z.enum(voiceHandoffTriggerOptions)).min(1, "Select at least one handoff trigger."),
});

export const voiceActionPolicySchema = z.object({
  allowedActions: z.array(z.enum(voiceAllowedActionOptions)).min(1, "Select at least one allowed action."),
  blockedActions: z.array(z.enum(voiceBlockedActionOptions)).min(1, "Select at least one blocked action."),
  erpWritesEnabled: z.boolean().default(false),
  backendAutoConfirmationEnabled: z.boolean().default(false),
}).superRefine((value, ctx) => {
  if (value.erpWritesEnabled) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["erpWritesEnabled"],
      message: "ERP writes must remain disabled until a package-specific backend write path exists.",
    });
  }

  if (value.backendAutoConfirmationEnabled) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["backendAutoConfirmationEnabled"],
      message: "Backend auto-confirmation must remain disabled until the live backend supports it safely.",
    });
  }
});

export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}
