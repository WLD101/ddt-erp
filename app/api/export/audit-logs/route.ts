import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { canUseFeature } from "@/lib/billing/enforcement";
import { getTenantStore } from "@/lib/db/client";
import { generateCSVResponse } from "@/lib/export-utils";
import * as auditService from "@/modules/admin/audit-service";
import {
  getCurrentTenantContext,
  requirePermission,
  requireRole,
  TenantForbiddenError,
  tenantForbiddenResponse,
} from "@/lib/tenant";

const EXPORT_UNAVAILABLE_MESSAGE =
  "Audit log export is only available on Enterprise workspaces.";

function getSingleValue(value: string | null) {
  return value?.trim() ? value.trim() : undefined;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const ctx = await getCurrentTenantContext();
    requirePermission(ctx, "audit.view");
    requireRole(ctx, "owner", "admin");

    const allowed = await canUseFeature(ctx.organizationId, "auditLogs");
    if (!allowed) {
      return NextResponse.json({ error: EXPORT_UNAVAILABLE_MESSAGE }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const db = getTenantStore(ctx);
    const result = await auditService.getAuditLogs(db, {
      search: getSingleValue(searchParams.get("search")),
      userId: getSingleValue(searchParams.get("userId")),
      entityType: getSingleValue(searchParams.get("entityType")),
      action: getSingleValue(searchParams.get("action")),
      startDate: getSingleValue(searchParams.get("startDate")),
      endDate: getSingleValue(searchParams.get("endDate")),
      page: 1,
      pageSize: 5000,
    });

    return generateCSVResponse(
      result.logs,
      [
        { header: "Timestamp", key: (item) => new Date(item.createdAt).toISOString() },
        { header: "Actor", key: (item) => item.user?.name || item.user?.email || "Unknown user" },
        { header: "Actor Email", key: (item) => item.user?.email || "" },
        { header: "Action", key: "action" },
        { header: "Entity Type", key: "entityType" },
        { header: "Entity ID", key: "entityId" },
        { header: "Details", key: "details" },
      ],
      "audit-log",
    );
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return tenantForbiddenResponse(error);
    }

    console.error("[audit-logs] export failed", {
      userId: session.user.id,
      error,
    });

    return NextResponse.json(
      { error: "We couldn't export audit logs right now. Please try again shortly." },
      { status: 500 },
    );
  }
}
