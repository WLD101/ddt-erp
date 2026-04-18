// app/api/export/suppliers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, tenantForbiddenResponse, TenantForbiddenError } from "@/lib/tenant";
import { generateCSVResponse } from "@/lib/export-utils";

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
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
    });

    return generateCSVResponse(
      suppliers,
      [
        { header: "Name", key: "name" },
        { header: "Contact Person", key: "contactPerson" },
        { header: "Email", key: "email" },
        { header: "Phone", key: "phone" },
        { header: "Address", key: "address" },
      ],
      "suppliers-export"
    );
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
