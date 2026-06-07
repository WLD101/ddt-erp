"use server";

import { voiceSignUpSchema, bootstrapVoiceOrganization } from "./voice-service";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { requestOtp, verifyOtp } from "@/modules/otp/service";
import { writePlatformAuditLog } from "@/lib/platform-audit";

export async function requestVoiceSignupOtpAction(data: unknown) {
  const result = voiceSignUpSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid signup details." };
  }

  const limit = await checkRateLimit(rateLimitKey("signup", result.data.email), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return { error: "Too many signup attempts. Please try again later." };
  }

  try {
    const otpRequest = await requestOtp({
      email: result.data.email,
      purpose: "VOICE_SIGNUP",
      payload: result.data,
    });
    if (!otpRequest.ok) {
      return { error: otpRequest.error || "Unable to send verification code right now." };
    }
    await writePlatformAuditLog({
      action: "OTP_SENT",
      entityType: "VoiceSignup",
      entityId: result.data.email.toLowerCase(),
      details: "Voice signup OTP sent.",
    });
    // For Voice, we will redirect them to a Voice-specific OTP verify page if we create one, 
    // or we can reuse the generic one for now by passing flow=voice. 
    // Wait, the generic verify-otp isn't rewritten to Voice! We will create a Voice OTP page.
    return { success: "Verification code sent. Please verify your email.", next: `/auth/verify-otp?flow=voice&email=${encodeURIComponent(result.data.email)}` };
  } catch (error: any) {
    console.error("Voice Signup error:", error);
    return { error: error.message || "Something went wrong during registration." };
  }
}

export async function verifyVoiceSignupOtpAction(data: unknown) {
  const input = data as any;
  if (!input?.email || !input?.code) return { error: "Email and OTP are required." };

  const verified = await verifyOtp({
    email: input.email,
    purpose: "VOICE_SIGNUP",
    code: input.code,
  });
  if (!verified.ok) return { error: verified.error };

  const payload = verified.payload;
  const parsed = voiceSignUpSchema.safeParse(payload);
  if (!parsed.success) return { error: "Signup payload expired. Please sign up again." };

  try {
    await bootstrapVoiceOrganization(parsed.data);
    await writePlatformAuditLog({
      action: "OTP_VERIFIED",
      entityType: "VoiceSignup",
      entityId: parsed.data.email.toLowerCase(),
      details: "Voice signup OTP verified and organization provisioned.",
    });
    // Send them to signin which redirects to voice onboarding
    return { success: "Email verified. Please sign in to continue.", next: "/auth/signin?callbackUrl=/onboarding" };
  } catch (error: any) {
    return { error: error.message || "Failed to complete signup." };
  }
}
