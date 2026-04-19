// app/api/sales/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, TenantForbiddenError, tenantForbiddenResponse } from "@/lib/tenant";
import { generateInvoicePDF } from "@/lib/pdf/invoice-generator";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 1. Resolve Auth & Tenant Context
    let ctx;
    try {
      ctx = await getCurrentTenantContext();
    } catch (err) {
      if (err instanceof TenantForbiddenError) {
        return tenantForbiddenResponse(err);
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Invoice Data with Security Check
    const invoice = await prisma.salesInvoice.findUnique({
      where: { 
        id_organizationId: { id: params.id, organizationId: ctx.organizationId } // Critical security boundary
      },
      include: {
        customer: true,
        organization: {
          select: { name: true }
        },
        items: {
          include: { product: { select: { name: true } } }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found or access denied." },
        { status: 404 }
      );
    }

    // 3. Generate PDF Buffer
    const pdfBuffer = generateInvoicePDF({
      ...invoice,
      issueDate: invoice.issueDate.toISOString(),
      items: invoice.items.map(item => ({
        ...item,
        product: { name: item.product.name }
      }))
    } as any);

    // 4. Return as Streamed Download
    const fileName = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error) {
    console.error("[API_SALES_PDF] Error:", error);
    return NextResponse.json(
      { error: "Internal server error during PDF generation." },
      { status: 500 }
    );
  }
}
