import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generatePaymentReceiptPDF } from "@/lib/pdf/payment-receipt-generator";
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
        return friendlyPdfError("You do not have access to this payment receipt PDF.", 403);
      }
      return friendlyPdfError("Please sign in to view this payment receipt PDF.", 401);
    }

    const payment = await prisma.payment.findUnique({
      where: {
        id_organizationId: {
          id,
          organizationId: ctx.organizationId,
        },
      },
      include: {
        organization: {
          select: {
            name: true,
            address: true,
            email: true,
            phone: true,
            currency: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        account: {
          select: {
            name: true,
            type: true,
          },
        },
        customer: true,
        supplier: true,
        salesInvoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
          },
        },
        purchaseInvoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!payment) {
      return friendlyPdfError("We couldn't find that payment receipt in your workspace.", 404);
    }

    assertOrganizationAccess(payment.organizationId, ctx.organizationId);
    assertBranchAccess({
      recordBranchId: payment.branchId,
      activeBranchId: ctx.branchId,
      role: ctx.role,
    });

    const pdfBuffer = generatePaymentReceiptPDF({
      ...payment,
      currency: payment.organization.currency,
    } as any);

    const targetName = sanitizeFilenamePart(
      payment.customer?.name || payment.supplier?.name || payment.organization.name,
      "Payment",
    );
    const referenceNumber = sanitizeFilenamePart(
      payment.referenceNumber ||
        payment.salesInvoice?.invoiceNumber ||
        payment.purchaseInvoice?.invoiceNumber ||
        payment.id,
      "Receipt",
    );
    const fileName = `Receipt-${targetName}-${referenceNumber}.pdf`;

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
    console.error("[API_PAYMENT_RECEIPT_PDF] Error:", error);
    return friendlyPdfError(
      "We couldn't generate this payment receipt right now. Please refresh and try again.",
      500,
    );
  }
}
