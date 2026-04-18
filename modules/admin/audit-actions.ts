// modules/admin/audit-actions.ts
"use server";

import * as service from "./audit-service";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";

import { canUseFeature } from "@/lib/billing/enforcement";

/**
 * FETCH PAGINATED AUDIT LOGS
 * Strictly restricted to owner/admin and subscription feature gate.
 */
export async function getAuditLogs(options: service.AuditLogFilterOptions = {}) {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "audit.view");
  requireRole(ctx, "owner", "admin");

  // FEATURE GATE
  const allowed = await canUseFeature(ctx.organizationId, "auditLogs");
  if (!allowed) {
    throw new Error("Audit Logs are only available on Enterprise plans.");
  }
  
  const db = getTenantStore(ctx);
  return service.getAuditLogs(db, options);
}

/**
 * FETCH FILTER METADATA
 */
export async function getAuditLogMetadata() {
  const ctx = await getCurrentTenantContext();
  requirePermission(ctx, "audit.view");
  requireRole(ctx, "owner", "admin");
  
  // FEATURE GATE
  const allowed = await canUseFeature(ctx.organizationId, "auditLogs");
  if (!allowed) {
    throw new Error("Audit log metadata is restricted to Enterprise plans.");
  }

  const db = getTenantStore(ctx);
  return service.getAuditMetadata(db);
}
