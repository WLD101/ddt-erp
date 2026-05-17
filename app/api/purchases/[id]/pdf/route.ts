import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generatePurchaseOrderPDF } from "@/lib/pdf/purchase-order-generator";
import { sanitizeFilenamePart } from "@/lib/pdf/document-utils";
import { assertBranchAccess, assertOrganizationAccess } from "@/lib/security/scope";
import { getCurrentTenantContext, TenantForbiddenError } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function friendlyPdfError(message: string, status: number) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    let ctx;
    try {
      ctx = await getCurrentTenantContext();
    } catch (error) {
      if (error instanceof TenantForbiddenError) {
        return friendlyPdfError("You do not have access to this purchase order PDF.", 403);
      }
      return friendlyPdfError("Please sign in to view this purchase order PDF.", 401);
    }

    const purchaseInvoice = await prisma.purchaseInvoice.findUnique({
      where: {
        id_organizationId: {
          id,
          organizationId: ctx.organizationId,
        },
      },
      include: {
        supplier: true,
        organization: {
          select: {
            name: true,
            address: true,
            email: true,
            phone: true,
            currency: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseInvoice) {
      return friendlyPdfError("We couldn't find that purchase order in your workspace.", 404);
    }

    assertOrganizationAccess(purchaseInvoice.organizationId, ctx.organizationId);
    assertBranchAccess({
      recordBranchId: purchaseInvoice.branchId,
      activeBranchId: ctx.branchId,
      role: ctx.role,
    });

    const pdfBuffer = generatePurchaseOrderPDF({
      ...purchaseInvoice,
      currency: purchaseInvoice.organization.currency,
    } as any);

    const supplierTarget = sanitizeFilenamePart(purchaseInvoice.supplier.name || purchaseInvoice.organization.name, "Supplier");
    const invoiceNumber = sanitizeFilenamePart(purchaseInvoice.invoiceNumber || purchaseInvoice.id, "Purchase");
    const fileName = `Purchase-Order-${supplierTarget}-${invoiceNumber}.pdf`;

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
    console.error("[API_PURCHASE_PDF] Error:", error);
    return friendlyPdfError(
      "We couldn't generate this purchase order PDF right now. Please refresh and try again.",
      500,
    );
  }
}
