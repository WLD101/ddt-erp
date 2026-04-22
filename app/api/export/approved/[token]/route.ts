import { consumeApprovedExportToken } from "@/modules/exports/actions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const exportRequest = await consumeApprovedExportToken(token);
  if (!exportRequest) {
    return NextResponse.json({ error: "Export link is invalid or expired." }, { status: 404 });
  }

  const rows = await buildRows(exportRequest);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Export");
  const columns = Object.keys(rows[0] ?? { status: "empty" });
  worksheet.columns = columns.map((key) => ({ header: key, key, width: Math.max(14, key.length + 2) }));
  worksheet.addRows(rows);
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ddt-erp-${exportRequest.scope}-export.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

async function buildRows(exportRequest: NonNullable<Awaited<ReturnType<typeof consumeApprovedExportToken>>>) {
  if (exportRequest.scope === "leads" || exportRequest.scope === "tenant_summary") {
    return [
      {
        name: exportRequest.requestedBy.name,
        email: exportRequest.requestedBy.email,
        phone: exportRequest.requestedBy.phone,
        organization: exportRequest.organization.name,
        city: exportRequest.organization.city,
        country: exportRequest.organization.country,
        status: exportRequest.organization.accessStatus,
        package: exportRequest.organization.organizationPackage?.package.name ?? exportRequest.organization.subscription?.planId,
        dates: exportRequest.createdAt.toISOString(),
      },
    ];
  }

  if (exportRequest.scope === "customers") {
    return prisma.customer.findMany({
      where: { organizationId: exportRequest.organizationId },
      select: { name: true, email: true, phone: true, address: true, createdAt: true },
    });
  }

  if (exportRequest.scope === "sales") {
    const sales = await prisma.salesInvoice.findMany({
      where: { organizationId: exportRequest.organizationId },
      include: { customer: true },
    });
    return sales.map((sale) => ({
      invoice: sale.invoiceNumber,
      name: sale.customer.name,
      email: sale.customer.email,
      phone: sale.customer.phone,
      organization: exportRequest.organization.name,
      city: exportRequest.organization.city,
      country: exportRequest.organization.country,
      status: sale.status,
      package: exportRequest.organization.organizationPackage?.package.name ?? exportRequest.organization.subscription?.planId,
      dates: sale.date.toISOString(),
      total: sale.totalAmount,
    }));
  }

  return [
    {
      name: exportRequest.requestedBy.name,
      email: exportRequest.requestedBy.email,
      phone: exportRequest.requestedBy.phone,
      organization: exportRequest.organization.name,
      city: exportRequest.organization.city,
      country: exportRequest.organization.country,
      status: exportRequest.organization.accessStatus,
      package: exportRequest.organization.organizationPackage?.package.name ?? exportRequest.organization.subscription?.planId,
      dates: exportRequest.createdAt.toISOString(),
    },
  ];
}
