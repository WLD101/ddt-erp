// app/api/export/inventory/route.ts
//
// Inventory CSV export route.
// SECURITY FIX: unauthenticated requests now receive a 401.
// The org-scoped query remains — now using a real resolved organizationId.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentTenantContext,
  TenantForbiddenError,
  tenantForbiddenResponse,
} from "@/lib/tenant";

export async function GET() {
  // ── Auth & tenant resolution ────────────────────────────────────────────
  let ctx;
  try {
    ctx = await getCurrentTenantContext();
  } catch (err) {
    if (err instanceof TenantForbiddenError) {
      return tenantForbiddenResponse(err);
    }
    return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
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

  // ── Org-scoped query ────────────────────────────────────────────────────
  try {
    const inventory = await prisma.inventoryItem.findMany({
      where: { organizationId: ctx.organizationId },
      include: {
        product: {
          select: { name: true, sku: true, unitPrice: true },
        },
      },
    });

    const csvHeader = "SKU,Product Name,Quantity On Hand,Location,Unit Price\n";
    const csvRows = inventory
      .map((item) => {
        const name = `"${item.product.name.replace(/"/g, '""')}"`;
        return [
          item.product.sku ?? "",
          name,
          item.quantity,
          item.location ?? "",
          item.product.unitPrice,
        ].join(",");
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;
    const date = new Date().toISOString().split("T")[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="inventory-export-${date}.csv"`,
        // Prevent browsers caching sensitive exports
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[Export] Inventory CSV export failed:", err);
    return NextResponse.json({ error: "Failed to export data." }, { status: 500 });
  }
}
