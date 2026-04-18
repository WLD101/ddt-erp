// lib/audit.ts
//
// Centralised audit log writer. All server actions and route handlers
// use these helpers instead of inline prisma.auditLog.create() calls.
//
// Design principle: audit logging must NEVER crash the calling operation.
// All writes are fire-and-forget wrapped in try/catch.

import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/tenant";

// ---------------------------------------------------------------------------
// Primary write
// ---------------------------------------------------------------------------

/**
 * Writes a structured audit log entry for a successful operation.
 *
 * @param ctx         - The resolved tenant context (user + org)
 * @param action      - Verb describing the operation, e.g. "create_sales_invoice"
 * @param entityType  - Prisma model name, e.g. "SalesInvoice"
 * @param entityId    - The primary key of the affected record
 * @param details     - Optional free-text detail string (JSON, notes, etc.)
 */
export async function writeAuditLog(
  ctx: TenantContext,
  action: string,
  entityType: string,
  entityId: string,
  details?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action,
        entityType,
        entityId,
        details: details ?? null,
      },
    });
  } catch (err) {
    // Intentional: a failed audit write must not bubble up and break the
    // primary operation. Log to stderr for ops visibility.
    console.error(
      `[AuditLog] Failed to write audit entry: action="${action}" entity="${entityType}:${entityId}"`,
      err
    );
  }
}

// ---------------------------------------------------------------------------
// Security event writer
// ---------------------------------------------------------------------------

/**
 * Logs a blocked cross-tenant access attempt.
 * The action is prefixed with "BLOCKED_" and the details include the reason.
 *
 * This is intentionally fire-and-await (not fire-and-forget) to ensure
 * security events are durably recorded before the caller throws.
 *
 * @param ctx            - The tenant context of the REQUESTER (not the target)
 * @param action         - The action that was attempted, e.g. "payment_create"
 * @param entityType     - The target entity type, e.g. "SalesInvoice"
 * @param targetEntityId - The ID of the entity the user tried to access/modify
 * @param reason         - Human-readable reason the attempt was blocked
 */
export async function logBlockedAccess(
  ctx: TenantContext,
  action: string,
  entityType: string,
  targetEntityId: string,
  reason: string
): Promise<void> {
  await writeAuditLog(
    ctx,
    `BLOCKED_${action.toUpperCase()}`,
    entityType,
    targetEntityId,
    `SECURITY VIOLATION: ${reason} | actor=user:${ctx.userId} org:${ctx.organizationId}`
  );
}
