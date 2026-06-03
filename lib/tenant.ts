// lib/tenant.ts
//
// Single source of truth for multi-tenant context resolution.
// Every server action and API route must call `getCurrentTenantContext()`
// before touching any domain data. It either returns a fully-resolved
// TenantContext or throws TenantForbiddenError — never a partial result.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminEmail, shouldResolveTenantContext } from "@/lib/security/access";

// ---------------------------------------------------------------------------
// Super Admin / Platform Oversight logic
// ---------------------------------------------------------------------------

/**
 * Checks if a user email belongs to the predefined list of platform operators.
 */
export function isSuperAdmin(email?: string | null): boolean {
  return isPlatformAdminEmail(email);
}

// ---------------------------------------------------------------------------
// Error type — use this to distinguish auth failures from runtime errors
// ---------------------------------------------------------------------------

export class TenantForbiddenError extends Error {
  readonly statusCode = 403;
  readonly cause?: string;

  constructor(message = "Tenant context could not be resolved. Access denied.", cause?: string) {
    super(message);
    this.name = "TenantForbiddenError";
    this.cause = cause;
    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TenantForbiddenError);
    }
  }
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Context shape returned to every caller
// ---------------------------------------------------------------------------

export type TenantContext = {
  /** Authenticated user's DB ID */
  userId: string;
  /** The organization this request is scoped to */
  organizationId: string;
  /** The active branch for this operation */
  branchId: string;
  /** Role name, e.g. "owner" | "admin" | "staff" */
  role: string;
  /** Flat list of permission names, e.g. ["customers.view"] */
  permissions: string[];
};

// ---------------------------------------------------------------------------
// Core resolver
// ---------------------------------------------------------------------------

/**
 * Resolves and validates the current authenticated user's tenant context.
 * Resolves branchId from cookies (user preference) or user's assigned branch.
 */
export async function getCurrentTenantContext(): Promise<TenantContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new TenantForbiddenError("No authenticated session found.");
  }



  const userId = session.user.id;
  const jwtOrgId = session.user.organizationId;
  const cookieStore = await cookies();
  const activeBranchId = cookieStore.get("x-active-branch")?.value;

  // Find membership with roles, permissions, and assigned branch
  let membership = await prisma.organizationUser.findFirst({
    where: { 
      userId,
      ...(jwtOrgId ? { organizationId: jwtOrgId } : {})
    },
    include: {
      role: { include: { permissions: true } },
      organization: {
        include: {
          branches: { where: { isMain: true }, take: 1 }
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) {
    const fallbackMembership = await prisma.organizationUser.findFirst({
      where: { userId },
      include: {
        role: { include: { permissions: true } },
        organization: {
          include: {
            branches: { where: { isMain: true }, take: 1 }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    if (fallbackMembership) {
      membership = fallbackMembership;
    } else {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!userExists) {
        // User ID in JWT no longer exists in DB (e.g. after a reseed).
        // Force sign-out to clear the stale cookie, breaking any redirect loop.
        redirect("/auth/force-signout");
      }
      
      const { getVoiceRequestHost, isVoiceHost, toVoiceExternalPath } = await import("@/lib/voice/routing");
      const host = await getVoiceRequestHost();
      
      if (isPlatformAdminEmail(session?.user?.email)) {
        if (isVoiceHost(host)) {
          redirect(toVoiceExternalPath("/admin/command-center", host));
        } else {
          redirect("/wq-command-center");
        }
      }
      
      if (isVoiceHost(host)) {
        redirect(toVoiceExternalPath("/login", host));
      } else {
        redirect("/onboarding");
      }
    }
  }

  // RESOLVE BRANCH ID
  // Priority: 1. Cookie choice | 2. Assigned branch | 3. Organization Main branch
  let resolvedBranchId = activeBranchId || membership.assignedBranchId;

  if (!resolvedBranchId) {
    resolvedBranchId = membership.organization.branches[0]?.id;
  }

  // Fallback: If still no branch (new org), find ANY branch or fail
  if (!resolvedBranchId) {
    const anyBranch = await prisma.branch.findFirst({
      where: { organizationId: membership.organizationId }
    });
    resolvedBranchId = anyBranch?.id ?? null;
  }

  if (!resolvedBranchId) {
    throw new TenantForbiddenError("No active branch resolved for this organization.");
  }

  // ── BRANCH AUTHENTICATION ───────────────────────────────────────────────
  // If the user isn't an owner/admin, they MUST be assigned to the requested branch.
  // Exception: If they have no assignment, they use the HQ fallback.
  const isPrivileged = ["owner", "admin"].includes(membership.role.name);
  if (!isPrivileged && membership.assignedBranchId && resolvedBranchId !== membership.assignedBranchId) {
    // If a staff user tries to use a different branch via cookie, force them back
    resolvedBranchId = membership.assignedBranchId;
  }

  return {
    userId,
    organizationId: membership.organizationId,
    branchId: resolvedBranchId as string,
    role: membership.role.name,
    permissions: membership.role.permissions.map((p) => p.name),
  };
}

// ---------------------------------------------------------------------------
// Guard helpers — call these inside actions that require elevated access
// ---------------------------------------------------------------------------

/**
 * Throws TenantForbiddenError if the resolved role is not in the allowed list.
 *
 * @example requireRole(ctx, "owner", "admin")
 */
export function requireRole(ctx: TenantContext, ...roles: string[]): void {
  if (!roles.includes(ctx.role)) {
    throw new TenantForbiddenError(
      `Role "${ctx.role}" is not authorised for this action. ` +
        `Required one of: [${roles.join(", ")}].`
    );
  }
}

/**
 * Throws TenantForbiddenError if the resolved context lacks the given permission.
 * NOTE: "owner" role always bypasses granular permission checks.
 *
 * @example requirePermission(ctx, "inventory.write")
 */
export function requirePermission(
  ctx: TenantContext,
  permission: string
): void {
  // OWNER BYPASS: The organization owner always having root access is a core security principle.
  if (ctx.role === "owner") return;

  if (!ctx.permissions.includes(permission)) {
    throw new TenantForbiddenError(
      `Permission "${permission}" is required for this action.`
    );
  }
}

/**
 * Basic guard that ensures a tenant context exists.
 * Useful for routes that don't need role/permission checks but must be scoped.
 */
export function requireTenant(ctx: TenantContext): void {
  if (!ctx.organizationId) {
    throw new TenantForbiddenError("Tenant context missing.");
  }
}

// ---------------------------------------------------------------------------
// HTTP-layer helper — converts a TenantForbiddenError to a standard Response
// for use in Route Handlers (app/api/*)
// ---------------------------------------------------------------------------

export function tenantForbiddenResponse(err: unknown): Response {
  const message =
    err instanceof TenantForbiddenError
      ? err.message
      : "Forbidden — tenant context invalid.";

  return Response.json({ error: message }, { status: 403 });
}
