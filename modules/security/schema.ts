import { z } from "zod";

export const totpCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Enter the 6-digit authenticator code.")
    .max(32, "Verification code is too long."),
});

export const verifyChallengeSchema = z.object({
  challengeToken: z.string().min(10, "Security challenge token is invalid."),
  verificationCode: z.string().trim().min(6, "Enter your verification code."),
  rememberDevice: z.boolean().optional().default(false),
});

export const disableTotpSchema = z.object({
  password: z.string().min(8, "Current password is required."),
  verificationCode: z.string().trim().min(6, "Enter a valid authenticator or recovery code."),
});

export const securityPolicySchema = z.object({
  requireTwoFactorForAllUsers: z.boolean().default(false),
  requireTwoFactorForPrivileged: z.boolean().default(true),
  enforcePasskeysForAdmins: z.boolean().default(false),
  restrictConcurrentSessions: z.boolean().default(false),
  forcePasswordReset: z.boolean().default(false),
  emergencyLockEnabled: z.boolean().default(false),
  maxActiveDevices: z.number().int().min(1).max(20).nullable(),
  idleTimeoutMinutes: z.number().int().min(5).max(720),
  absoluteSessionLifetimeMinutes: z.number().int().min(15).max(10080).nullable(),
  staffIdleTimeoutMinutes: z.number().int().min(5).max(720).nullable(),
  managerIdleTimeoutMinutes: z.number().int().min(5).max(720).nullable(),
  accountantIdleTimeoutMinutes: z.number().int().min(5).max(720).nullable(),
  adminIdleTimeoutMinutes: z.number().int().min(5).max(720).nullable(),
  superAdminIdleTimeoutMinutes: z.number().int().min(5).max(720).nullable(),
});

export type SecurityPolicyInput = z.infer<typeof securityPolicySchema>;
