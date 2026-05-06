import { Prisma } from "@prisma/client";

import { ScopedPrisma } from "@/lib/db/client";

import { WooOrder, WooProduct } from "./types";
import { WOO_ORDER_STATUS_TO_INVOICE_STATUS } from "./constants";

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function resolveDefaultBranchId(db: ScopedPrisma) {
  const branch =
    (await db.branch.findFirst({
      where: { isMain: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })) ||
    (await db.branch.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!branch) {
    throw new Error("No branch exists for this organization. Create a branch before syncing WooCommerce data.");
  }

  return branch.id;
}

async function resolveCategoryId(db: ScopedPrisma, externalProduct: WooProduct) {
  const categoryName = externalProduct.categories?.[0]?.name;
  if (!categoryName) {
    return null;
  }

  const category =
    (await db.category.findFirst({
      where: { name: categoryName },
      select: { id: true },
    })) ||
    (await db.category.create({
      data: {
        organizationId: db.organizationId,
        name: categoryName,
      },
      select: { id: true },
    }));

  return category.id;
}

export async function mapWooProductToProduct(
  db: ScopedPrisma,
  channelId: string,
  externalProduct: WooProduct
) {
  const categoryId = await resolveCategoryId(db, externalProduct);

  const existingMap = await db.externalProductMap.findFirst({
    where: { salesChannelId: channelId, externalProductId: String(externalProduct.id) },
    include: { product: true },
  });

  const existingProduct =
    existingMap?.product ||
    (externalProduct.sku
      ? await db.product.findFirst({
          where: { sku: externalProduct.sku },
        })
      : null);

  const regularPrice = toNumber(externalProduct.regular_price);
  const salePrice = toNumber(externalProduct.sale_price);
  const unitPrice = salePrice > 0 ? salePrice : regularPrice;

  const productUpdatePayload: Prisma.ProductUncheckedUpdateInput = {
    name: externalProduct.name,
    sku: externalProduct.sku || null,
    categoryId,
    unitPrice,
    costPrice: unitPrice,
  };

  const productCreatePayload: Prisma.ProductUncheckedCreateInput = {
    organizationId: db.organizationId,
    name: externalProduct.name,
    sku: externalProduct.sku || null,
    categoryId,
    unitPrice,
    costPrice: unitPrice,
  };

  const product = existingProduct
    ? await db.product.update({
        where: { id: existingProduct.id },
        data: productUpdatePayload,
      })
    : await db.product.create({
        data: productCreatePayload,
      });

  const branchId = await resolveDefaultBranchId(db);
  const quantity = Math.max(0, Math.round(externalProduct.stock_quantity ?? 0));

  await db.inventoryItem.upsert({
    where: {
      organizationId_branchId_productId: {
        organizationId: db.organizationId,
        branchId,
        productId: product.id,
      },
    },
    create: {
      organizationId: db.organizationId,
      branchId,
      productId: product.id,
      quantity,
      location: "WooCommerce Sync",
    },
    update: {
      quantity,
    },
  });

  const metadata = JSON.stringify({
    regularPrice,
    salePrice: salePrice > 0 ? salePrice : null,
    stockStatus: externalProduct.stock_status ?? null,
    manageStock: externalProduct.manage_stock ?? false,
    imageUrl: externalProduct.images?.[0]?.src ?? null,
    categories: (externalProduct.categories ?? []).map((category) => category.name),
  });

  const map = existingMap
    ? await db.externalProductMap.update({
        where: { id: existingMap.id },
        data: {
          productId: product.id,
          externalSku: externalProduct.sku || null,
          externalTitle: externalProduct.name,
          syncStatus: "LINKED",
          metadata,
          lastSyncedAt: new Date(),
        },
      })
    : await db.externalProductMap.create({
        data: {
          organizationId: db.organizationId,
          salesChannelId: channelId,
          productId: product.id,
          externalProductId: String(externalProduct.id),
          externalSku: externalProduct.sku || null,
          externalTitle: externalProduct.name,
          syncStatus: "LINKED",
          metadata,
          lastSyncedAt: new Date(),
        },
      });

  return { product, map, created: !existingProduct };
}

async function resolveMappedProductId(
  db: ScopedPrisma,
  channelId: string,
  item: WooOrder["line_items"][number]
) {
  const mapped = await db.externalProductMap.findFirst({
    where: { salesChannelId: channelId, externalProductId: String(item.product_id) },
    select: { productId: true },
  });

  if (mapped) {
    return mapped.productId;
  }

  if (item.sku) {
    const bySku = await db.product.findFirst({
      where: { sku: item.sku },
      select: { id: true },
    });

    if (bySku) {
      return bySku.id;
    }
  }

  const mappedProduct = await mapWooProductToProduct(db, channelId, {
    id: item.product_id,
    name: item.name,
    sku: item.sku ?? "",
    regular_price: String(item.price ?? (toNumber(item.subtotal) || 0)),
    sale_price: String(item.price ?? (toNumber(item.total) || 0)),
    stock_quantity: 0,
    manage_stock: false,
    stock_status: "instock",
    categories: [],
    images: [],
  });

  return mappedProduct.product.id;
}

function formatBillingName(order: WooOrder) {
  const first = order.billing?.first_name?.trim() || "";
  const last = order.billing?.last_name?.trim() || "";
  const full = `${first} ${last}`.trim();
  return full || `Woo Customer ${order.number}`;
}

export async function mapWooOrderToSalesInvoice(
  db: ScopedPrisma,
  channelId: string,
  externalOrder: WooOrder
) {
  const existingMap = await db.externalOrderMap.findFirst({
    where: { salesChannelId: channelId, externalOrderId: String(externalOrder.id) },
    include: { salesInvoice: true },
  });

  const invoiceStatus = WOO_ORDER_STATUS_TO_INVOICE_STATUS[externalOrder.status.toLowerCase()] ?? "SENT";

  if (existingMap?.salesInvoice) {
    const updatedInvoice = await db.salesInvoice.update({
      where: { id: existingMap.salesInvoice.id },
      data: {
        status: invoiceStatus,
        notes: [
          "Imported from WooCommerce",
          `Order #${externalOrder.number}`,
          externalOrder.payment_method_title ? `Payment: ${externalOrder.payment_method_title}` : null,
          externalOrder.shipping_total ? `Shipping: ${externalOrder.shipping_total}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      },
    });

    await db.externalOrderMap.update({
      where: { id: existingMap.id },
      data: {
        externalStatus: externalOrder.status,
        paymentStatus: externalOrder.payment_method ?? null,
        metadata: JSON.stringify({
          subtotal: toNumber(externalOrder.subtotal),
          shipping: toNumber(externalOrder.shipping_total),
          discount: toNumber(externalOrder.total_discount),
          total: toNumber(externalOrder.total),
        }),
        lastSyncedAt: new Date(),
      },
    });

    return { invoice: updatedInvoice, created: false, alreadyImported: true };
  }

  const branchId = await resolveDefaultBranchId(db);
  const customerName = formatBillingName(externalOrder);

  const customer =
    (externalOrder.billing?.phone
      ? await db.customer.findFirst({
          where: { phone: externalOrder.billing.phone },
        })
      : null) ||
    (externalOrder.billing?.email
      ? await db.customer.findFirst({
          where: { email: externalOrder.billing.email },
        })
      : null) ||
    (await db.customer.create({
      data: {
        organizationId: db.organizationId,
        name: customerName,
        phone: externalOrder.billing?.phone ?? null,
        email: externalOrder.billing?.email ?? null,
        address: [
          externalOrder.billing?.address_1,
          externalOrder.billing?.city,
          externalOrder.billing?.country,
        ]
          .filter(Boolean)
          .join(", ") || null,
      },
    }));

  const items = [];
  let subtotal = 0;
  for (const item of externalOrder.line_items) {
    const productId = await resolveMappedProductId(db, channelId, item);
    const total = toNumber(item.total);
    const unitPrice = item.quantity > 0 ? total / item.quantity : toNumber(item.price);
    subtotal += toNumber(item.subtotal);
    items.push({
      productId,
      quantity: item.quantity,
      unitPrice,
      total,
    });
  }

  const discount = toNumber(externalOrder.total_discount);
  const shipping = toNumber(externalOrder.shipping_total);
  const totalAmount = toNumber(externalOrder.total);

  const invoice = await db.salesInvoice.create({
    data: {
      organizationId: db.organizationId,
      branchId,
      customerId: customer.id,
      invoiceNumber: `WOO-${externalOrder.number}`,
      status: invoiceStatus,
      date: externalOrder.date_created ? new Date(externalOrder.date_created) : new Date(),
      subtotal: subtotal || Math.max(0, totalAmount - shipping + discount),
      discount,
      taxAmount: 0,
      totalAmount,
      notes: [
        "Imported from WooCommerce",
        `Order ID: ${externalOrder.id}`,
        externalOrder.payment_method_title ? `Payment: ${externalOrder.payment_method_title}` : null,
        shipping ? `Shipping: ${shipping}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
      items: { create: items },
    },
  });

  await db.externalOrderMap.create({
    data: {
      organizationId: db.organizationId,
      salesChannelId: channelId,
      salesInvoiceId: invoice.id,
      externalOrderId: String(externalOrder.id),
      externalOrderNumber: externalOrder.number,
      externalCustomerId: externalOrder.billing?.phone ?? externalOrder.billing?.email ?? null,
      externalPaymentId: externalOrder.payment_method ?? null,
      externalStatus: externalOrder.status,
      paymentStatus: externalOrder.payment_method_title ?? null,
      metadata: JSON.stringify({
        subtotal: toNumber(externalOrder.subtotal),
        shipping,
        discount,
        total: totalAmount,
        billingName: customerName,
      }),
      lastSyncedAt: new Date(),
    },
  });

  return { invoice, created: true, alreadyImported: false };
}
