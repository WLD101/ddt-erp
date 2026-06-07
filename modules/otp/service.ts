import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/modules/emails/service";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { isOtpBypassEnabled } from "@/lib/security/env";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export type OtpPurpose = "DEMO_SIGNUP" | "PAID_SIGNUP" | "VOICE_SIGNUP" | "PASSWORD_RESET";

function hashOtp(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function requestOtp(params: {
  email: string;
  purpose: OtpPurpose;
  payload?: unknown;
}) {
  const email = params.email.toLowerCase();
  const rateLimit = await checkRateLimit(rateLimitKey(`otp:${params.purpose}`, email), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return { ok: false as const, error: "Too many verification requests. Please try again later." };
  }

  const existing = await prisma.otpVerification.findFirst({
    where: { email, purpose: params.purpose, verifiedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  if (existing && now.getTime() - existing.lastSentAt.getTime() < OTP_COOLDOWN_MS) {
    return { ok: true, cooldown: true };
  }

  const code = generateOtp();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
  await prisma.otpVerification.create({
    data: {
      email,
      purpose: params.purpose,
      payload: params.payload ? JSON.stringify(params.payload) : null,
      codeHash: hashOtp(code),
      expiresAt,
      lastSentAt: now,
      maxAttempts: OTP_MAX_ATTEMPTS,
    },
  });

  await sendTransactionalEmail({
    to: email,
    subject: "Your WhatsQuery verification code",
    html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
  }).catch(() => null);
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP:${params.purpose}] Code for ${email}: ${code}`);
  }
  return { ok: true, expiresAt };
}

export async function verifyOtp(params: {
  email: string;
  purpose: OtpPurpose;
  code: string;
}) {
  const email = params.email.toLowerCase();
  const record = await prisma.otpVerification.findFirst({
    where: { email, purpose: params.purpose, verifiedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false as const, error: "OTP not found." };
  if (record.expiresAt < new Date()) return { ok: false as const, error: "OTP expired." };
  if (record.attemptCount >= record.maxAttempts) return { ok: false as const, error: "Too many attempts." };

  const isDemoBypass = isOtpBypassEnabled() && params.code === "000000";
  if (record.codeHash !== hashOtp(params.code) && !isDemoBypass) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attemptCount: { increment: 1 } },
    });
    return { ok: false as const, error: "Invalid OTP." };
  }

  const verifiedAt = new Date();
  const verified = await prisma.otpVerification.update({
    where: { id: record.id },
    data: { verifiedAt },
  });
  return {
    ok: true as const,
    payload: verified.payload ? JSON.parse(verified.payload) : null,
    verifiedAt,
  };
}

export async function assertOtpVerified(email: string, purpose: OtpPurpose) {
  const verified = await prisma.otpVerification.findFirst({
    where: { email: email.toLowerCase(), purpose, verifiedAt: { not: null } },
    orderBy: { verifiedAt: "desc" },
  });
  if (!verified) throw new Error("OTP verification is required.");
  return verified;
}
