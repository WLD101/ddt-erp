"use server";

import * as service from "./audit-service";
import {
  TenantForbiddenError,
  getCurrentTenantContext,
  requirePermission,
} from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { canUseFeature } from "@/lib/billing/enforcement";

const AUDIT_LOGS_UNAVAILABLE_MESSAGE =
  "Audit logs are available on Enterprise workspaces. Contact your workspace administrator if you need this feature enabled.";
const AUDIT_LOGS_LOAD_MESSAGE =
  "We couldn't load audit logs right now. Please refresh the page or contact your workspace administrator if the issue continues.";
const AUDIT_LOGS_FORBIDDEN_MESSAGE =
  "You do not have permission to view audit logs for this workspace.";

/**
 * FETCH PAGINATED AUDIT LOGS
 * Restricted by audit permission and subscription feature gate.
 */
export async function getAuditLogs(options: service.AuditLogFilterOptions = {}) {
  let ctx;
  try {
    ctx = await getCurrentTenantContext();
    requirePermission(ctx, "audit.view");
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: AUDIT_LOGS_FORBIDDEN_MESSAGE,
        logs: [],
        total: 0,
        page: options.page ?? 1,
        pageSize: options.pageSize ?? 20,
        totalPages: 0,
      };
    }
    throw error;
  }

  const allowed = await canUseFeature(ctx.organizationId, "auditLogs");
  if (!allowed) {
    return {
      ok: false,
      code: "FEATURE_UNAVAILABLE",
      message: AUDIT_LOGS_UNAVAILABLE_MESSAGE,
      logs: [],
      total: 0,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 20,
      totalPages: 0,
    };
  }

  const db = getTenantStore(ctx);
  try {
    const result = await service.getAuditLogs(db, options);
    return { ok: true, ...result };
  } catch (error) {
    console.error("[audit-logs] failed to load logs", {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      options,
      error,
    });
    return {
      ok: false,
      code: "LOAD_FAILED",
      message: AUDIT_LOGS_LOAD_MESSAGE,
      logs: [],
      total: 0,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 20,
      totalPages: 0,
    };
  }
}

/**
 * FETCH FILTER METADATA
 */
export async function getAuditLogMetadata() {
  let ctx;
  try {
    ctx = await getCurrentTenantContext();
    requirePermission(ctx, "audit.view");
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: AUDIT_LOGS_FORBIDDEN_MESSAGE,
        users: [],
        entityTypes: [],
        actions: [],
      };
    }
    throw error;
  }

  const allowed = await canUseFeature(ctx.organizationId, "auditLogs");
  if (!allowed) {
    return {
      ok: false,
      code: "FEATURE_UNAVAILABLE",
      message: AUDIT_LOGS_UNAVAILABLE_MESSAGE,
      users: [],
      entityTypes: [],
      actions: [],
    };
  }

  const db = getTenantStore(ctx);
  try {
    const result = await service.getAuditMetadata(db);
    return { ok: true, ...result };
  } catch (error) {
    console.error("[audit-logs] failed to load metadata", {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      error,
    });
    return {
      ok: false,
      code: "LOAD_FAILED",
      message: AUDIT_LOGS_LOAD_MESSAGE,
      users: [],
      entityTypes: [],
      actions: [],
    };
  }
}
