import { Prisma } from "@prisma/client";

import { ScopedPrisma } from "@/lib/db/client";

import { DarazOrder, DarazProduct } from "./types";
import { DARAZ_ORDER_STATUS_TO_INVOICE_STATUS } from "./constants";

async function resolveDefaultBranchId(db: ScopedPrisma) {
  const branch = await db.branch.findFirst({
    where: { isMain: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (branch) {
    return branch.id;
  }

  const fallback = await db.branch.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!fallback) {
    throw new Error("No branch exists for this organization. Create a branch before syncing Daraz data.");
  }

  return fallback.id;
}

export async function mapDarazProductToProduct(
  db: ScopedPrisma,
  channelId: string,
  externalProduct: DarazProduct
) {
  let categoryId: string | null = null;

  if (externalProduct.categoryName) {
    const category =
      (await db.category.findFirst({
        where: { name: externalProduct.categoryName },
        select: { id: true },
      })) ||
      (await db.category.create({
        data: {
          organizationId: db.organizationId,
          name: externalProduct.categoryName,
        },
        select: { id: true },
      }));

    categoryId = category.id;
  }

  const existingMap = await db.externalProductMap.findFirst({
    where: { salesChannelId: channelId, externalProductId: externalProduct.id },
    include: { product: true },
  });

  const existingProduct =
    existingMap?.product ||
    (externalProduct.sku
      ? await db.product.findFirst({
          where: { sku: externalProduct.sku },
        })
      : null);

  const productPayload: Prisma.ProductUncheckedCreateInput | Prisma.ProductUncheckedUpdateInput = {
    name: externalProduct.name,
    sku: externalProduct.sku || null,
    categoryId,
    unitPrice: externalProduct.price,
    costPrice: externalProduct.price,
  };

  const product = existingProduct
    ? await db.product.update({
        where: { id: existingProduct.id },
        data: productPayload as Prisma.ProductUncheckedUpdateInput,
      })
    : await db.product.create({
        data: productPayload as Prisma.ProductUncheckedCreateInput,
      });

  const branchId = await resolveDefaultBranchId(db);
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
      quantity: Math.max(0, Math.round(externalProduct.quantity)),
      location: "Daraz Sync",
    },
    update: {
      quantity: Math.max(0, Math.round(externalProduct.quantity)),
    },
  });

  const map = existingMap
    ? await db.externalProductMap.update({
        where: { id: existingMap.id },
        data: {
          productId: product.id,
          externalSku: externalProduct.sku || null,
          externalTitle: externalProduct.name,
          syncStatus: "LINKED",
          metadata: JSON.stringify({
            imageUrl: externalProduct.imageUrl ?? null,
            categoryName: externalProduct.categoryName ?? null,
            status: externalProduct.status ?? null,
            price: externalProduct.price,
            quantity: externalProduct.quantity,
          }),
          lastSyncedAt: new Date(),
        },
      })
    : await db.externalProductMap.create({
      data: {
          organizationId: db.organizationId,
          salesChannelId: channelId,
          productId: product.id,
          externalProductId: externalProduct.id,
          externalSku: externalProduct.sku || null,
          externalTitle: externalProduct.name,
          syncStatus: "LINKED",
          metadata: JSON.stringify({
            imageUrl: externalProduct.imageUrl ?? null,
            categoryName: externalProduct.categoryName ?? null,
            status: externalProduct.status ?? null,
            price: externalProduct.price,
            quantity: externalProduct.quantity,
          }),
          lastSyncedAt: new Date(),
        },
      });

  return { product, map, created: !existingProduct };
}

async function resolveMappedProductId(
  db: ScopedPrisma,
  channelId: string,
  item: DarazOrder["items"][number]
) {
  const mapped = await db.externalProductMap.findFirst({
    where: { salesChannelId: channelId, externalProductId: item.productId },
    select: { productId: true },
  });

  if (mapped) {
    return mapped.productId;
  }

  const bySku = await db.product.findFirst({
    where: { sku: item.sku },
    select: { id: true },
  });

  if (bySku) {
    return bySku.id;
  }

  const mappedProduct = await mapDarazProductToProduct(db, channelId, {
    id: item.productId,
    name: item.name,
    sku: item.sku,
    price: item.salePrice,
    quantity: 0,
  });

  return mappedProduct.product.id;
}

export async function mapDarazOrderToSalesInvoice(
  db: ScopedPrisma,
  channelId: string,
  externalOrder: DarazOrder
) {
  const existingMap = await db.externalOrderMap.findFirst({
    where: { salesChannelId: channelId, externalOrderId: externalOrder.orderId },
    include: { salesInvoice: true },
  });

  const invoiceStatus = DARAZ_ORDER_STATUS_TO_INVOICE_STATUS[externalOrder.status.toLowerCase()] ?? "SENT";

  if (existingMap?.salesInvoice) {
    const updatedInvoice = await db.salesInvoice.update({
      where: { id: existingMap.salesInvoice.id },
      data: {
        status: invoiceStatus,
        notes: [
          `Daraz order ${externalOrder.orderNumber}`,
          externalOrder.paymentMethod ? `Payment: ${externalOrder.paymentMethod}` : null,
          externalOrder.shippingFee != null ? `Shipping Fee: ${externalOrder.shippingFee}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      },
    });

    await db.externalOrderMap.update({
      where: { id: existingMap.id },
      data: {
        externalStatus: externalOrder.status,
        paymentStatus: externalOrder.paymentStatus ?? null,
        metadata: JSON.stringify({
          shippingFee: externalOrder.shippingFee ?? null,
          paymentMethod: externalOrder.paymentMethod ?? null,
          itemCount: externalOrder.items.length,
        }),
        lastSyncedAt: new Date(),
      },
    });

    return { invoice: updatedInvoice, created: false };
  }

  const branchId = await resolveDefaultBranchId(db);

  const customerName = externalOrder.customerName?.trim() || `Daraz Customer ${externalOrder.orderNumber}`;
  const customer =
    (externalOrder.customerPhone
      ? await db.customer.findFirst({
          where: { phone: externalOrder.customerPhone },
        })
      : null) ||
    (externalOrder.customerEmail
      ? await db.customer.findFirst({
          where: { email: externalOrder.customerEmail },
        })
      : null) ||
    (await db.customer.create({
      data: {
        organizationId: db.organizationId,
        name: customerName,
        phone: externalOrder.customerPhone ?? null,
        email: externalOrder.customerEmail ?? null,
        address: externalOrder.shippingAddress ?? null,
      },
    }));

  const itemPayload = [];
  let subtotal = 0;

  for (const item of externalOrder.items) {
    const productId = await resolveMappedProductId(db, channelId, item);
    const total = item.salePrice * item.quantity;
    subtotal += total;
    itemPayload.push({
      productId,
      quantity: item.quantity,
      unitPrice: item.salePrice,
      total,
    });
  }

  const invoice = await db.salesInvoice.create({
    data: {
      organizationId: db.organizationId,
      branchId,
      customerId: customer.id,
      invoiceNumber: `DRZ-${externalOrder.orderNumber}`,
      status: invoiceStatus,
      date: externalOrder.createdAt ? new Date(externalOrder.createdAt) : new Date(),
      subtotal,
      discount: 0,
      taxAmount: 0,
      totalAmount: subtotal,
      notes: [
        `Imported from Daraz Pakistan`,
        `Order ID: ${externalOrder.orderId}`,
        externalOrder.paymentMethod ? `Payment: ${externalOrder.paymentMethod}` : null,
        externalOrder.shippingFee != null ? `Shipping Fee: ${externalOrder.shippingFee}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
      items: { create: itemPayload },
    },
  });

  await db.externalOrderMap.create({
    data: {
      organizationId: db.organizationId,
      salesChannelId: channelId,
      salesInvoiceId: invoice.id,
      externalOrderId: externalOrder.orderId,
      externalOrderNumber: externalOrder.orderNumber,
      externalCustomerId: externalOrder.customerPhone ?? externalOrder.customerEmail ?? null,
      externalPaymentId: externalOrder.paymentMethod ?? null,
      externalStatus: externalOrder.status,
      paymentStatus: externalOrder.paymentStatus ?? null,
      metadata: JSON.stringify({
        shippingFee: externalOrder.shippingFee ?? null,
        paymentMethod: externalOrder.paymentMethod ?? null,
        itemCount: externalOrder.items.length,
      }),
      lastSyncedAt: new Date(),
    },
  });

  return { invoice, created: true };
}
