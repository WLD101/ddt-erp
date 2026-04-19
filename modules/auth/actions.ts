"use server";

import { signIn, signOut } from "@/lib/auth";
import * as service from "./service";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

/**
 * SIGN UP / ORG BOOTSTRAP
 */
export async function signUpAction(data: unknown) {
  const result = service.signUpSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  try {
    await service.bootstrapOrganization(result.data);
    return { success: "Account and Organization created successfully. You can now sign in." };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: error.message || "Something went wrong during registration." };
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
export async function forgotPasswordAction(email: string) {
  try {
    await service.requestPasswordReset(email);
    return { success: true };
  } catch (error) {
    return { error: (error as any).message };
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
