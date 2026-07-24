import { z } from "zod";

export const voiceWhatsappIntegrationSchema = z.object({
  whatsappBusinessAccountId: z.string().trim().optional().or(z.literal("")),
  phoneNumberId: z.string().trim().min(3, "WhatsApp phone number ID is required."),
  phoneNumberDisplayName: z.string().trim().optional().or(z.literal("")),
  accessToken: z.string().trim().optional().or(z.literal("")),
  webhookVerifyToken: z.string().trim().optional().or(z.literal("")),
  voiceAgentId: z.string().trim().optional().or(z.literal("")),
  staffNotificationNumber: z.string().trim().optional().or(z.literal("")),
  isEnabled: z.boolean().default(false),
});

export const voiceWhatsappTemplateSchema = z.object({
  name: z.string().trim().min(2, "Template name is required."),
  language: z.string().trim().min(2, "Template language is required.").default("en"),
  category: z.string().trim().optional().or(z.literal("")),
  body: z.string().trim().min(8, "Template body is required."),
});

export type VoiceWhatsappIntegrationInput = z.infer<typeof voiceWhatsappIntegrationSchema>;
