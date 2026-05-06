import { assertErpAccess } from "@/lib/billing/access";
import { requirePlatformAdmin, requireAuthenticatedUser } from "@/lib/security/guards";
import { getCurrentTenantContext } from "@/lib/tenant";

export async function requireAuth() {
  return requireAuthenticatedUser();
}

export async function requireAdmin() {
  return requirePlatformAdmin();
}

export async function requireTenant() {
  return getCurrentTenantContext();
}

export async function requireSubscription() {
  const ctx = await getCurrentTenantContext();
  await assertErpAccess(ctx);
  return ctx;
}
