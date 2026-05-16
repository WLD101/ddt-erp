// app/api/sales/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, TenantForbiddenError } from "@/lib/tenant";
import { generateInvoicePDF } from "@/lib/pdf/invoice-generator";
import { assertBranchAccess, assertOrganizationAccess } from "@/lib/security/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeFilenamePart(value: string | null | undefined) {
  return (value || "Organization")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "Organization";
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    let ctx;
    try {
      ctx = await getCurrentTenantContext();
    } catch (err) {
      if (err instanceof TenantForbiddenError) {
        return friendlyPdfError("You do not have access to this invoice PDF.", 403);
      }
      return friendlyPdfError("Please sign in to view this invoice PDF.", 401);
    }

    const invoice = await prisma.salesInvoice.findUnique({
      where: { 
        id_organizationId: { id, organizationId: ctx.organizationId }
      },
      include: {
        customer: true,
        organization: {
          select: { name: true, address: true, email: true, phone: true, currency: true }
        },
        items: {
          include: { product: { select: { name: true, unit: true } } }
        }
      }
    });

    if (!invoice) {
      return friendlyPdfError("We couldn't find that invoice in your workspace.", 404);
    }

    assertOrganizationAccess(invoice.organizationId, ctx.organizationId);
    assertBranchAccess({
      recordBranchId: invoice.branchId,
      activeBranchId: ctx.branchId,
      role: ctx.role,
    });

    const pdfBuffer = generateInvoicePDF({
      ...invoice,
      issueDate: invoice.date.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      currency: invoice.organization.currency,
      items: invoice.items.map(item => ({
        ...item,
        product: { name: item.product.name, unit: item.product.unit }
      }))
    } as any);

    const invoiceTarget = sanitizeFilenamePart(invoice.customer.name || invoice.organization.name);
    const invoiceNumber = sanitizeFilenamePart(invoice.invoiceNumber || invoice.id);
    const fileName = `Invoice-${invoiceTarget}-${invoiceNumber}.pdf`;

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
    console.error("[API_SALES_PDF] Error:", error);
    return friendlyPdfError(
      "We couldn't generate this invoice PDF right now. Please refresh and try again.",
      500
    );
  }
}
