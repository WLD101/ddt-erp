import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isPlatformAdminEmail } from "./access";
import { AuthorizationError } from "./errors";

export { AuthorizationError };

export async function requireAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthorizationError("Authentication required.", 401);
  }
  return session;
}

export async function requirePlatformAdmin() {
  const session = await requireAuthenticatedUser();
  if (!isPlatformAdminEmail(session.user.email)) {
    throw new AuthorizationError("Platform administrator access required.", 403);
  }
  return session;
}

export async function requirePlatformAdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    console.log("Unauthorized admin access attempt");
    redirect("/auth/signin?callbackUrl=/wq-command-center");
  }
  if (!isPlatformAdminEmail(session.user.email)) {
    console.log("Unauthorized admin access attempt");
    redirect("/dashboard");
  }
  return session;
}

export function authorizationErrorResponse(error: unknown) {
  if (error instanceof AuthorizationError) {
    return Response.json({ error: error.message }, { status: error.statusCode });
  }
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
