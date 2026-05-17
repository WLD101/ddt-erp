import { consumeApprovedExportToken } from "@/modules/exports/actions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const exportRequest = await consumeApprovedExportToken(token) as any;
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
      "Content-Disposition": `attachment; filename="whatsquery-${exportRequest.scope}-export.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

async function buildRows(exportRequest: any) {
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

  if (exportRequest.scope === "suppliers") {
    return prisma.supplier.findMany({
      where: { organizationId: exportRequest.organizationId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });
  }

  if (exportRequest.scope === "products") {
    return prisma.product.findMany({
      where: { organizationId: exportRequest.organizationId },
      select: {
        name: true,
        sku: true,
        unitType: true,
        unit: true,
        unitPrice: true,
        costPrice: true,
        lowStockThreshold: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  if (exportRequest.scope === "inventory") {
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { organizationId: exportRequest.organizationId },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            unitType: true,
            unit: true,
            lowStockThreshold: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ branch: { name: "asc" } }, { product: { name: "asc" } }],
    });

    return inventoryItems.map((item) => ({
      branch: item.branch.name,
      product: item.product.name,
      sku: item.product.sku,
      unitType: item.product.unitType,
      unit: item.product.unit,
      quantity: item.quantity,
      lowStockThreshold: item.product.lowStockThreshold,
      location: item.location,
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  if (exportRequest.scope === "purchases") {
    const purchases = await prisma.purchaseInvoice.findMany({
      where: { organizationId: exportRequest.organizationId },
      include: {
        supplier: true,
        items: true,
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return purchases.map((purchase) => ({
      invoice: purchase.invoiceNumber,
      supplier: purchase.supplier.name,
      supplierEmail: purchase.supplier.email,
      branch: purchase.branch?.name ?? "",
      issueDate: purchase.issueDate.toISOString(),
      dueDate: purchase.dueDate?.toISOString() ?? "",
      status: purchase.status,
      itemCount: purchase.items.length,
      subtotal: purchase.subtotal,
      taxAmount: purchase.taxAmount,
      total: purchase.totalAmount,
      createdAt: purchase.createdAt.toISOString(),
    }));
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

  if (exportRequest.scope === "quotations") {
    const quotations = await prisma.quotation.findMany({
      where: { organizationId: exportRequest.organizationId },
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
    });

    return quotations.map((quote) => ({
      quotation: quote.quotationNumber ?? quote.id,
      customer: quote.customer.name,
      customerEmail: quote.customer.email,
      status: quote.status,
      issueDate: quote.createdAt.toISOString(),
      expiryDate: quote.expiryDate?.toISOString() ?? "",
      itemCount: quote.items.length,
      discount: quote.discount ?? 0,
      total: quote.totalAmount,
      organization: exportRequest.organization.name,
      city: exportRequest.organization.city,
      country: exportRequest.organization.country,
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
