"use server";

import { signIn, signOut } from "@/lib/auth";
import * as service from "./service";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { requestOtp, verifyOtp } from "@/modules/otp/service";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { getPostSignInRedirect, sanitizeRedirectPath } from "@/lib/security/access";
import { isProductionEnv } from "@/lib/security/env";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  createSignInChallenge,
  logSecurityEvent,
  shouldRequireTwoFactor,
  TRUSTED_DEVICE_COOKIE,
  updateTrustedDeviceUsage,
} from "@/modules/security/service";

/**
 * SIGN UP / ORG BOOTSTRAP
 */
export async function signUpAction(data: unknown) {
  return requestPaidSignupOtpAction(data);
}

export async function requestPaidSignupOtpAction(data: unknown) {
  const result = service.signUpSchema.safeParse(data);

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
      purpose: "PAID_SIGNUP",
      payload: result.data,
    });
    if (!otpRequest.ok) {
      return { error: otpRequest.error || "Unable to send verification code right now." };
    }
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
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const callbackUrl = sanitizeRedirectPath(formData.get("callbackUrl") as string, "/dashboard");

  if (!isProductionEnv()) {
    console.log("--> signInAction invoked for email:", email, "and callbackUrl:", callbackUrl);
  }

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const limit = await checkRateLimit(rateLimitKey("login", email), {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    return { error: "Too many sign-in attempts. Please try again later." };
  }

  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      memberships: {
        include: { role: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user?.password) {
    await logSecurityEvent({
      userId: user?.id || null,
      organizationId: user?.memberships[0]?.organizationId || null,
      type: "auth.login.failed",
      status: "warning",
      details: `Failed sign-in attempt for ${email}`,
      metadata: { reason: "invalid_credentials" },
    }).catch(() => null);
    return { error: "Invalid credentials." };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    await logSecurityEvent({
      userId: user.id,
      organizationId: user.memberships[0]?.organizationId || null,
      type: "auth.login.failed",
      status: "warning",
      details: `Failed sign-in attempt for ${email}`,
      metadata: { reason: "invalid_credentials" },
    }).catch(() => null);
    return { error: "Invalid credentials." };
  }

  const primaryMembership = user.memberships[0];
  const requestHost = await import("@/lib/voice/routing").then(m => m.getVoiceRequestHost());
  const isVoice = await import("@/lib/voice/routing").then(m => m.isVoiceHost(requestHost));

  const redirectTo = getPostSignInRedirect({
    email: user.email,
    callbackUrl,
    organizationId: primaryMembership?.organizationId,
    isVoice,
  });

  let twoFactorRequirement:
    | Awaited<ReturnType<typeof shouldRequireTwoFactor>>
    | null = null;

  if (primaryMembership) {
    twoFactorRequirement = await shouldRequireTwoFactor({
      userId: user.id,
      organizationId: primaryMembership.organizationId,
      role: primaryMembership.role.name,
    });

    if (twoFactorRequirement.policy?.forcePasswordReset) {
      return { error: "Your workspace requires a password reset before you can continue. Use the forgot password flow to set a new password." };
    }

    if (twoFactorRequirement.policy?.emergencyLockEnabled) {
      await logSecurityEvent({
        userId: user.id,
        organizationId: primaryMembership.organizationId,
        type: "auth.login.blocked",
        status: "critical",
        details: "Login blocked by tenant emergency account lock.",
      }).catch(() => null);
      return { error: "This workspace is temporarily locked by a security administrator." };
    }

    if (twoFactorRequirement.required && twoFactorRequirement.enrolled) {
      const cookieStore = await cookies();
      const trustedToken = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;
      const trustedDevice = trustedToken
        ? await updateTrustedDeviceUsage(user.id, trustedToken).catch(() => null)
        : null;

      if (!trustedDevice) {
        const challenge = await createSignInChallenge({
          userId: user.id,
          organizationId: primaryMembership.organizationId,
          redirectTo,
          trustDeviceRequested: true,
        });
        await logSecurityEvent({
          userId: user.id,
          organizationId: primaryMembership.organizationId,
          type: "auth.login.challenge_issued",
          status: "info",
          details: "Two-factor verification challenge issued during sign-in.",
        }).catch(() => null);
        return {
          requiresTwoFactor: true,
          next: `/auth/verify-2fa?token=${encodeURIComponent(challenge.token)}`,
        };
      }
    }
  }

  try {
      await signIn("credentials", {
        email,
        password,
      redirectTo:
        !isVoice && twoFactorRequirement?.required && !twoFactorRequirement.enrolled
          ? "/settings/security?required=1"
          : redirectTo,
    });
  } catch (error: any) {
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
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Invalid invitation details." };

  try {
    await service.joinByInvitation(result.data);
    revalidatePath("/(dashboard)", "layout");
    return { success: "Joined organization successfully. Please sign in." };
  } catch (error: unknown) {
    console.error("Join error:", error);
    return { error: error instanceof Error ? error.message : "Failed to join organization." };
  }
}

/**
 * FORGOT PASSWORD
 */
export async function forgotPasswordAction(email: string, isVoice = false): Promise<{ success?: boolean; error?: string }> {
  const limit = await checkRateLimit(rateLimitKey("password-reset", email), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return { success: true };
  }

  try {
    await service.requestPasswordReset(email, isVoice);
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
