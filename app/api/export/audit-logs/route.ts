import { NextResponse } from "next/server";

import { buildAuditExportResponse, type AuditExportCategory, type AuditExportFormat } from "@/lib/audit-export";
import { auth } from "@/lib/auth";
import { canUseFeature } from "@/lib/billing/enforcement";
import { writeAuditLog } from "@/lib/audit";
import { getTenantStore } from "@/lib/db/client";
import * as auditService from "@/modules/admin/audit-service";
import {
  getCurrentTenantContext,
  requirePermission,
  TenantForbiddenError,
  tenantForbiddenResponse,
} from "@/lib/tenant";

const EXPORT_UNAVAILABLE_MESSAGE =
  "Audit log export is only available on Enterprise workspaces.";

function getSingleValue(value: string | null) {
  return value?.trim() ? value.trim() : undefined;
}

function isAuditExportFormat(value: string | undefined): value is AuditExportFormat {
  return value === "pdf" || value === "xlsx" || value === "csv" || value === "json";
}

function isAuditExportCategory(value: string | undefined): value is AuditExportCategory {
  return value === "all"
    || value === "login_activity"
    || value === "staff_actions"
    || value === "customer_changes"
    || value === "product_changes"
    || value === "invoice_changes"
    || value === "finance_changes"
    || value === "export_download_activity"
    || value === "assistant_actions";
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const ctx = await getCurrentTenantContext();
    requirePermission(ctx, "audit.view");
    requirePermission(ctx, "audit.export");

    const allowed = await canUseFeature(ctx.organizationId, "auditLogs");
    if (!allowed) {
      return NextResponse.json({ error: EXPORT_UNAVAILABLE_MESSAGE }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const formatParam = getSingleValue(searchParams.get("format"))?.toLowerCase();
    const categoryParam = getSingleValue(searchParams.get("category"))?.toLowerCase();
    const reason = getSingleValue(searchParams.get("reason"));
    const format: AuditExportFormat = isAuditExportFormat(formatParam) ? formatParam : "pdf";
    const category: AuditExportCategory = isAuditExportCategory(categoryParam) ? categoryParam : "all";

    if (!reason || reason.length < 8) {
      return NextResponse.json(
        { error: "Please include a short reason for exporting audit logs." },
        { status: 400 },
      );
    }

    if (format === "json" && !["owner", "admin"].includes(ctx.role)) {
      return NextResponse.json(
        { error: "JSON audit exports are only available to workspace administrators." },
        { status: 403 },
      );
    }

    const db = getTenantStore(ctx);
    const [result, organization] = await Promise.all([
      auditService.getAuditLogs(db, {
        search: getSingleValue(searchParams.get("search")),
        userId: getSingleValue(searchParams.get("userId")),
        entityType: getSingleValue(searchParams.get("entityType")),
        action: getSingleValue(searchParams.get("action")),
        startDate: getSingleValue(searchParams.get("startDate")),
        endDate: getSingleValue(searchParams.get("endDate")),
        page: 1,
        pageSize: 5000,
      }),
      db.organization.findFirst({
        where: { id: ctx.organizationId },
        select: { name: true },
      }),
    ]);

    const response = await buildAuditExportResponse({
      logs: result.logs,
      organizationName: organization?.name || "Workspace",
      requestedBy: session.user.name || session.user.email || "Workspace user",
      category,
      format,
      reason,
      fromDate: getSingleValue(searchParams.get("startDate")),
      toDate: getSingleValue(searchParams.get("endDate")),
    });

    await writeAuditLog(
      ctx,
      "EXPORT_AUDIT_LOGS",
      "AuditLog",
      ctx.organizationId,
      JSON.stringify({
        format,
        category,
        reason,
        search: getSingleValue(searchParams.get("search")) || null,
        userId: getSingleValue(searchParams.get("userId")) || null,
        entityType: getSingleValue(searchParams.get("entityType")) || null,
        action: getSingleValue(searchParams.get("action")) || null,
        startDate: getSingleValue(searchParams.get("startDate")) || null,
        endDate: getSingleValue(searchParams.get("endDate")) || null,
        userAgent: request.headers.get("user-agent"),
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip"),
      }),
    );

    return response;
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
