import { z } from "zod";

export const voiceLanguageOptions = ["ENGLISH", "URDU", "ROMAN_URDU", "AUTO_DETECT"] as const;
export const voiceGoalOptions = ["ANSWER_FAQS", "CAPTURE_LEADS", "BOOK_APPOINTMENTS", "ROUTE_CALLS"] as const;
export const voiceAfterHoursOptions = ["TAKE_MESSAGE", "TEXT_FALLBACK", "VOICEMAIL", "ESCALATE"] as const;
export const voiceLeadCaptureFields = ["name", "phone", "email", "reason", "appointment_time"] as const;
export const voiceFallbackContactOptions = ["WHATSAPP", "SMS", "EMAIL", "HUMAN_TRANSFER", "NONE"] as const;

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || /^https?:\/\//i.test(value), "Website must start with http:// or https://");

export const voiceBusinessProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required."),
  industry: z.string().trim().min(2, "Industry is required."),
  website: optionalUrl,
  preferredCallingCountry: z.enum(["PK", "US", "GB"]).default("PK"),
  businessPhone: z.string().trim().min(5, "Business phone is required."),
  preferredLanguage: z.enum(voiceLanguageOptions),
  openingHours: z.string().trim().min(5, "Opening hours are required."),
  mainGoal: z.enum(voiceGoalOptions),
  fallbackContactMethod: z.enum(voiceFallbackContactOptions),
  greetingMessage: z.string().trim().min(8, "Greeting message is required."),
});

export const voiceReceptionistSettingsSchema = z.object({
  receptionistName: z.string().trim().min(2, "Receptionist name is required."),
  greetingMessage: z.string().trim().min(8, "Greeting message is required."),
  fallbackMessage: z.string().trim().min(8, "Fallback message is required."),
  languageMode: z.enum(voiceLanguageOptions),
  businessHours: z.string().trim().min(5, "Business hours are required."),
  afterHoursBehavior: z.enum(voiceAfterHoursOptions),
  leadCaptureFields: z
    .array(z.enum(voiceLeadCaptureFields))
    .min(1, "Select at least one lead capture field."),
});

export const voiceKnowledgeBaseItemSchema = z.object({
  id: z.string().trim().optional(),
  question: z.string().trim().min(4, "Question is required."),
  answer: z.string().trim().min(8, "Answer is required."),
  category: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const deleteVoiceKnowledgeBaseItemSchema = z.object({
  id: z.string().trim().min(1, "Knowledge base item is required."),
});

export const voiceLeadSchema = z.object({
  name: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  reasonForCall: z.string().trim().min(3, "Reason for call is required."),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]).default("NEW"),
  notes: z.string().trim().optional().or(z.literal("")),
  appointmentRequested: z.boolean().default(false),
});

export const voiceCallLogSchema = z.object({
  callerNumber: z.string().trim().min(5, "Caller number is required."),
  callStatus: z.enum(["MISSED", "COMPLETED", "VOICEMAIL", "ABANDONED"]).default("MISSED"),
  callDirection: z.enum(["INBOUND", "OUTBOUND"]).default("INBOUND"),
  summary: z.string().trim().min(5, "Summary is required."),
  transcriptPlaceholder: z.string().trim().optional().or(z.literal("")),
  durationSeconds: z.coerce.number().int().min(0).max(24 * 60 * 60),
  appointmentRequested: z.boolean().default(false),
});

export function parseLeadCaptureFields(raw: string | null | undefined) {
  if (!raw) return ["name", "phone", "reason"] as string[];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === "string");
    }
  } catch {
    // Fall through to safe default.
  }

  return ["name", "phone", "reason"] as string[];
}
