"use server";

import { signIn, signOut } from "@/lib/auth";
import * as service from "./service";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { requestOtp, verifyOtp } from "@/modules/otp/service";
import { writePlatformAuditLog } from "@/lib/platform-audit";

/**
 * SIGN UP / ORG BOOTSTRAP
 */
export async function signUpAction(data: unknown) {
  return requestPaidSignupOtpAction(data);
}

export async function requestPaidSignupOtpAction(data: unknown) {
  const result = service.signUpSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const limit = checkRateLimit(rateLimitKey("signup", result.data.email), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return { error: "Too many signup attempts. Please try again later." };
  }

  try {
    await requestOtp({
      email: result.data.email,
      purpose: "PAID_SIGNUP",
      payload: result.data,
    });
    await writePlatformAuditLog({
      action: "OTP_SENT",
      entityType: "PaidSignup",
      entityId: result.data.email.toLowerCase(),
      details: "Paid signup OTP sent.",
    });
    return { success: "Verification code sent. Please verify your email.", next: `/auth/verify-otp?flow=paid&email=${encodeURIComponent(result.data.email)}` };
  } catch (error: any) {
    console.error("Signup error:", error);
    return { error: error.message || "Something went wrong during registration." };
  }
}

export async function verifyPaidSignupOtpAction(data: unknown) {
  const input = data as any;
  if (!input?.email || !input?.code) return { error: "Email and OTP are required." };

  const verified = await verifyOtp({
    email: input.email,
    purpose: "PAID_SIGNUP",
    code: input.code,
  });
  if (!verified.ok) return { error: verified.error };

  const payload = verified.payload;
  const parsed = service.signUpSchema.safeParse(payload);
  if (!parsed.success) return { error: "Signup payload expired. Please sign up again." };

  try {
    await service.bootstrapOrganization(parsed.data);
    await writePlatformAuditLog({
      action: "OTP_VERIFIED",
      entityType: "PaidSignup",
      entityId: parsed.data.email.toLowerCase(),
      details: "Paid signup OTP verified and organization provisioned.",
    });
    return { success: "Email verified. Please sign in to continue onboarding.", next: "/auth/signin?callbackUrl=/onboarding/packages" };
  } catch (error: any) {
    return { error: error.message || "Failed to complete signup." };
  }
}

/**
 * SIGN IN
 */
export async function signInAction(_prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}

/**
 * SIGN OUT
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/auth/signin" });
}

/**
 * JOIN VIA INVITATION
 */
export async function joinOrganizationAction(data: unknown) {
  const result = service.joinSchema.safeParse(data);
  if (!result.success) return { error: result.error.errors[0].message };

  try {
    await service.joinByInvitation(result.data);
    revalidatePath("/(dashboard)", "layout");
    return { success: "Joined organization successfully. Please sign in." };
  } catch (error) {
    console.error("Join error:", error);
    return { error: error.message || "Failed to join organization." };
  }
}

/**
 * FORGOT PASSWORD
 */
export async function forgotPasswordAction(email: string): Promise<{ success?: boolean; error?: string }> {
  const limit = checkRateLimit(rateLimitKey("password-reset", email), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return { success: true };
  }

  try {
    await service.requestPasswordReset(email);
    return { success: true };
  } catch {
    return { success: true };
  }
}

/**
 * RESET PASSWORD
 */
export async function resetPasswordAction(data: { token: string; password: string }) {
  try {
    await service.resetPassword(data.token, data.password);
    return { success: true };
  } catch (error) {
    return { error: (error as any).message };
  }
}
