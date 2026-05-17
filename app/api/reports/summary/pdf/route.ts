import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentTenantContext,
  requirePermission,
  TenantForbiddenError,
} from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { canUseFeature } from "@/lib/billing/enforcement";
import * as reportsService from "@/modules/reports/service";
import { generateReportSummaryPDF } from "@/lib/pdf/report-summary-generator";
import { sanitizeFilenamePart } from "@/lib/pdf/document-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeDateInput(value: string | null) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
}

function normalizeInterval(value: string | null): "day" | "week" | "month" {
  if (value === "week" || value === "month") {
    return value;
  }

  return "day";
}

function friendlyPdfError(message: string, status: number) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET(request: Request) {
  try {
    let ctx;
    try {
      ctx = await getCurrentTenantContext();
      requirePermission(ctx, "reports.view");
    } catch (error) {
      if (error instanceof TenantForbiddenError) {
        return friendlyPdfError("You do not have access to this report summary.", 403);
      }

      return friendlyPdfError("Please sign in to view this report summary.", 401);
    }

    const url = new URL(request.url);
    const fromDate = normalizeDateInput(url.searchParams.get("fromDate"));
    const toDate = normalizeDateInput(url.searchParams.get("toDate"));
    const interval = normalizeInterval(url.searchParams.get("interval"));
    const db = getTenantStore(ctx);
    const organization = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { name: true, currency: true },
    });
    const canViewAdvancedTrends = await canUseFeature(ctx.organizationId, "advancedReports");

    const [metrics, transactions, topProducts, balances, trends] = await Promise.all([
      reportsService.getDashboardMetrics(db, ctx.branchId, fromDate, toDate),
      reportsService.getRecentTransactions(db, ctx.branchId, 10),
      reportsService.getTopProducts(db, ctx.branchId, 5),
      reportsService.getOutstandingBalances(db),
      canViewAdvancedTrends
        ? reportsService.getFinancialTrends(db, ctx.branchId, 30, fromDate, toDate, interval)
        : Promise.resolve([]),
    ]);

    const pdfBuffer = generateReportSummaryPDF({
      organizationName: organization?.name || "WhatsQuery Workspace",
      currency: organization?.currency || "PKR",
      generatedAt: new Date(),
      fromDate,
      toDate,
      interval,
      metrics,
      transactions,
      topProducts,
      balances,
      trends,
    });

    const orgName = sanitizeFilenamePart(organization?.name, "Workspace");
    const fromLabel = sanitizeFilenamePart(fromDate || "Last-30-Days", "Range");
    const toLabel = sanitizeFilenamePart(toDate || "Today", "Today");
    const fileName = `Report-Summary-${orgName}-${fromLabel}-to-${toLabel}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0",
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("[API_REPORT_SUMMARY_PDF] Error:", error);
    return friendlyPdfError(
      "We couldn't generate this report summary right now. Please refresh and try again.",
      500
    );
  }
}
