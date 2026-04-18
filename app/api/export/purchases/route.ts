// app/api/export/purchases/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, tenantForbiddenResponse, TenantForbiddenError } from "@/lib/tenant";
import { generateCSVResponse } from "@/lib/export-utils";
import { format } from "date-fns";

export async function GET() {
  let ctx;
  try {
    ctx = await getCurrentTenantContext();
  } catch (err) {
    if (err instanceof TenantForbiddenError) return tenantForbiddenResponse(err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Subscription Gate ───────────────────────────────────────────────────
  const { canUseFeature } = await import("@/lib/billing/enforcement");
  const allowed = await canUseFeature(ctx.organizationId, "exportData");
  if (!allowed) {
    return NextResponse.json(
      { error: "Data export is only available on Pro and Enterprise plans." }, 
      { status: 403 }
    );
  }

  try {
    const purchases = await prisma.purchaseInvoice.findMany({
      where: { organizationId: ctx.organizationId },
      include: { supplier: true },
      orderBy: { createdAt: "desc" },
    });

    return generateCSVResponse(
      purchases,
      [
        { header: "Invoice No", key: "invoiceNumber" },
        { header: "Date", key: (item) => format(new Date(item.issueDate), "yyyy-MM-dd") },
        { header: "Supplier", key: (item) => item.supplier.name },
        { header: "Status", key: "status" },
        { header: "Total Amount", key: (item) => item.totalAmount.toFixed(2) },
      ],
      "purchases-export"
    );
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
