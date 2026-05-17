import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, TenantForbiddenError } from "@/lib/tenant";
import { assertBranchAccess, assertOrganizationAccess } from "@/lib/security/scope";
import { generateQuotationPDF } from "@/lib/pdf/quotation-generator";
import { sanitizeFilenamePart } from "@/lib/pdf/document-utils";

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    let ctx;
    try {
      ctx = await getCurrentTenantContext();
    } catch (error) {
      if (error instanceof TenantForbiddenError) {
        return friendlyPdfError("You do not have access to this quotation PDF.", 403);
      }

      return friendlyPdfError("Please sign in to view this quotation PDF.", 401);
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id_organizationId: {
          id,
          organizationId: ctx.organizationId,
        },
      },
      include: {
        customer: true,
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

    if (!quotation) {
      return friendlyPdfError("We couldn't find that quotation in your workspace.", 404);
    }

    assertOrganizationAccess(quotation.organizationId, ctx.organizationId);
    assertBranchAccess({
      recordBranchId: quotation.branchId,
      activeBranchId: ctx.branchId,
      role: ctx.role,
    });

    const subtotal = quotation.items.reduce((sum, item) => sum + item.total, 0);
    const pdfBuffer = generateQuotationPDF({
      quotationNumber: quotation.quotationNumber || quotation.id,
      issueDate: quotation.createdAt.toISOString(),
      expiryDate: quotation.expiryDate?.toISOString() ?? null,
      status: quotation.status,
      subtotal,
      discount: quotation.discount || 0,
      totalAmount: quotation.totalAmount,
      notes: quotation.notes,
      currency: quotation.organization.currency,
      organization: quotation.organization,
      customer: quotation.customer,
      items: quotation.items.map((item) => ({
        ...item,
        product: {
          name: item.product.name,
          unit: item.product.unit,
        },
      })),
    });

    const customerName = sanitizeFilenamePart(
      quotation.customer.name || quotation.organization.name,
      "Customer"
    );
    const quoteNumber = sanitizeFilenamePart(
      quotation.quotationNumber || quotation.id,
      "Quotation"
    );
    const fileName = `Quotation-${customerName}-${quoteNumber}.pdf`;

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
    console.error("[API_QUOTATION_PDF] Error:", error);
    return friendlyPdfError(
      "We couldn't generate this quotation PDF right now. Please refresh and try again.",
      500
    );
  }
}
