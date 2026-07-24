import { z } from "zod";

export const initiateCallSchema = z.object({
  from: z.string().trim().optional().or(z.literal("")),
  to: z.string().trim().min(5, "Destination number is required."),
  selectedCountry: z.string().trim().optional().or(z.literal("")),
  callerNumberId: z.string().trim().optional().or(z.literal("")),
  idempotencyKey: z.string().trim().min(8).max(160).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const verifyPhoneNumberSchema = z.object({
  number: z.string().trim().min(5, "Phone number is required."),
  countryCode: z.string().trim().min(2, "Country is required."),
  type: z.enum(["inbound", "outbound", "both"]).default("both"),
});

export const routingRuleSchema = z.object({
  tenantId: z.string().trim().optional().or(z.literal("")),
  countryName: z.string().trim().min(2),
  isoCode: z.string().trim().min(2).max(3),
  dialCode: z.string().trim().startsWith("+"),
  prefix: z.string().trim().optional().or(z.literal("")),
  providerId: z.string().trim().min(1),
  fallbackProviderId: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  priority: z.coerce.number().int().min(1).max(10_000).default(100),
  weight: z.coerce.number().int().min(0).max(10_000).default(100),
  validFrom: z.string().datetime().optional().or(z.literal("")),
  validUntil: z.string().datetime().optional().or(z.literal("")),
  maxConcurrentCalls: z.coerce.number().int().positive().optional(),
  callsPerSecond: z.coerce.number().int().positive().optional(),
  requireHealthyProvider: z.boolean().default(true),
  fallbackEligible: z.boolean().default(true),
  emergencyOverride: z.boolean().default(false),
  businessHoursJson: z.string().trim().optional().or(z.literal("")),
});

export const routeSimulationSchema = z.object({
  tenantId: z.string().trim().min(1),
  destination: z.string().trim().min(5),
  callerNumberId: z.string().trim().optional().or(z.literal("")),
  simulateAt: z.string().datetime().optional().or(z.literal("")),
});

export const providerMaintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().max(500).optional().or(z.literal("")),
});

export const telecomJobAdminActionSchema = z.object({
  jobId: z.string().trim().min(1),
  action: z.enum(["retry", "cancel"]),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});
