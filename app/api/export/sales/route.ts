// app/api/export/sales/route.ts
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
    const sales = await prisma.salesInvoice.findMany({
      where: { organizationId: ctx.organizationId },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return generateCSVResponse(
      sales,
      [
        { header: "Invoice No", key: "invoiceNumber" },
        { header: "Date", key: (item) => format(new Date(item.issueDate), "yyyy-MM-dd") },
        { header: "Customer", key: (item) => item.customer.name },
        { header: "Status", key: "status" },
        { header: "Subtotal", key: (item) => item.subtotal.toFixed(2) },
        { header: "Discount", key: (item) => item.discount.toFixed(2) },
        { header: "Tax", key: (item) => item.taxAmount.toFixed(2) },
        { header: "Total", key: (item) => item.totalAmount.toFixed(2) },
      ],
      "sales-export"
    );
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
