import { Prisma } from "@prisma/client";

import { ScopedPrisma } from "@/lib/db/client";

import { SHOPIFY_FINANCIAL_TO_INVOICE_STATUS } from "./constants";
import { ShopifyOrder, ShopifyProduct, ShopifyProductVariant } from "./types";

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
    throw new Error("No branch exists for this organization. Create a branch before syncing Shopify data.");
  }

  return branch.id;
}

function firstVariant(product: ShopifyProduct) {
  return product.variants[0];
}

export async function mapShopifyProductToProduct(
  db: ScopedPrisma,
  channelId: string,
  externalProduct: ShopifyProduct,
  variantOverride?: ShopifyProductVariant
) {
  const variant = variantOverride ?? firstVariant(externalProduct);
  if (!variant) {
    throw new Error(`Shopify product ${externalProduct.id} has no variants to map.`);
  }

  const existingMap =
    (await db.externalProductMap.findFirst({
      where: { salesChannelId: channelId, externalVariantId: String(variant.id) },
      include: { product: true },
    })) ||
    (await db.externalProductMap.findFirst({
      where: { salesChannelId: channelId, externalProductId: String(externalProduct.id) },
      include: { product: true },
    }));

  const existingProduct =
    existingMap?.product ||
    (variant.sku
      ? await db.product.findFirst({
          where: { sku: variant.sku },
        })
      : null);

  const unitPrice = toNumber(variant.price);
  const productUpdatePayload: Prisma.ProductUncheckedUpdateInput = {
    name: externalProduct.title,
    sku: variant.sku || null,
    unitPrice,
    costPrice: unitPrice,
  };
  const productCreatePayload: Prisma.ProductUncheckedCreateInput = {
    organizationId: db.organizationId,
    name: externalProduct.title,
    sku: variant.sku || null,
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
  const quantity = Math.max(0, Math.round(variant.inventory_quantity ?? 0));

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
      location: "Shopify Sync",
    },
    update: {
      quantity,
    },
  });

  const metadata = JSON.stringify({
    imageUrl:
      externalProduct.image?.src ??
      externalProduct.images?.[0]?.src ??
      null,
    variantTitle: variant.title ?? null,
    inventoryItemId: variant.inventory_item_id ?? null,
    inventoryQuantity: variant.inventory_quantity ?? null,
  });

  const map = existingMap
    ? await db.externalProductMap.update({
        where: { id: existingMap.id },
        data: {
          productId: product.id,
          externalProductId: String(externalProduct.id),
          externalVariantId: String(variant.id),
          externalSku: variant.sku || null,
          externalTitle: externalProduct.title,
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
          externalVariantId: String(variant.id),
          externalSku: variant.sku || null,
          externalTitle: externalProduct.title,
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
  item: ShopifyOrder["line_items"][number]
) {
  const mapped =
    (await db.externalProductMap.findFirst({
      where: { salesChannelId: channelId, externalVariantId: String(item.variant_id ?? "") },
      select: { productId: true },
    })) ||
    (await db.externalProductMap.findFirst({
      where: { salesChannelId: channelId, externalProductId: String(item.product_id ?? "") },
      select: { productId: true },
    }));

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

  const mappedProduct = await mapShopifyProductToProduct(
    db,
    channelId,
    {
      id: item.product_id ?? item.variant_id ?? item.id,
      title: item.title,
      variants: [
        {
          id: item.variant_id ?? item.id,
          product_id: item.product_id ?? item.id,
          sku: item.sku ?? null,
          price: item.price,
          inventory_quantity: 0,
          inventory_item_id: null,
        },
      ],
      images: [],
      image: null,
    },
    {
      id: item.variant_id ?? item.id,
      product_id: item.product_id ?? item.id,
      sku: item.sku ?? null,
      price: item.price,
      inventory_quantity: 0,
      inventory_item_id: null,
    }
  );

  return mappedProduct.product.id;
}

function formatCustomerName(order: ShopifyOrder) {
  const first = order.customer?.first_name?.trim() || "";
  const last = order.customer?.last_name?.trim() || "";
  const full = `${first} ${last}`.trim();
  return full || `Shopify Customer ${order.order_number}`;
}

export async function mapShopifyOrderToSalesInvoice(
  db: ScopedPrisma,
  channelId: string,
  externalOrder: ShopifyOrder
) {
  const existingMap = await db.externalOrderMap.findFirst({
    where: { salesChannelId: channelId, externalOrderId: String(externalOrder.id) },
    include: { salesInvoice: true },
  });

  const invoiceStatus =
    SHOPIFY_FINANCIAL_TO_INVOICE_STATUS[
      (externalOrder.financial_status || "").toLowerCase()
    ] ?? "SENT";

  if (existingMap?.salesInvoice) {
    const updatedInvoice = await db.salesInvoice.update({
      where: { id: existingMap.salesInvoice.id },
      data: {
        status: invoiceStatus,
        notes: [
          "Imported from Shopify",
          `Order #${externalOrder.order_number}`,
          externalOrder.financial_status
            ? `Financial: ${externalOrder.financial_status}`
            : null,
          externalOrder.fulfillment_status
            ? `Fulfillment: ${externalOrder.fulfillment_status}`
            : null,
        ]
          .filter(Boolean)
          .join(" | "),
      },
    });

    await db.externalOrderMap.update({
      where: { id: existingMap.id },
      data: {
        externalStatus: externalOrder.fulfillment_status ?? externalOrder.financial_status ?? null,
        paymentStatus: externalOrder.financial_status ?? null,
        metadata: JSON.stringify({
          discounts: toNumber(externalOrder.current_total_discounts),
          shipping: toNumber(
            externalOrder.total_shipping_price_set?.shop_money?.amount
          ),
          total: toNumber(externalOrder.current_total_price),
          fulfillmentStatus: externalOrder.fulfillment_status ?? null,
        }),
        lastSyncedAt: new Date(),
      },
    });

    return { invoice: updatedInvoice, created: false, alreadyImported: true };
  }

  const branchId = await resolveDefaultBranchId(db);
  const customerName = formatCustomerName(externalOrder);

  const customer =
    (externalOrder.customer?.phone
      ? await db.customer.findFirst({
          where: { phone: externalOrder.customer.phone },
        })
      : null) ||
    (externalOrder.customer?.email || externalOrder.contact_email
      ? await db.customer.findFirst({
          where: { email: externalOrder.customer?.email ?? externalOrder.contact_email ?? undefined },
        })
      : null) ||
    (await db.customer.create({
      data: {
        organizationId: db.organizationId,
        name: customerName,
        phone: externalOrder.customer?.phone ?? externalOrder.phone ?? null,
        email: externalOrder.customer?.email ?? externalOrder.contact_email ?? null,
      },
    }));

  const items = [];
  let subtotal = 0;
  for (const item of externalOrder.line_items) {
    const productId = await resolveMappedProductId(db, channelId, item);
    const total = toNumber(item.price) * item.quantity;
    subtotal += total;
    items.push({
      productId,
      quantity: item.quantity,
      unitPrice: toNumber(item.price),
      total,
    });
  }

  const discount = toNumber(externalOrder.current_total_discounts);
  const shipping = toNumber(
    externalOrder.total_shipping_price_set?.shop_money?.amount
  );
  const totalAmount = toNumber(externalOrder.current_total_price) || Math.max(0, subtotal - discount + shipping);

  const invoice = await db.salesInvoice.create({
    data: {
      organizationId: db.organizationId,
      branchId,
      customerId: customer.id,
      invoiceNumber: `SHP-${externalOrder.order_number}`,
      status: invoiceStatus,
      issueDate: externalOrder.created_at ? new Date(externalOrder.created_at) : new Date(),
      subtotal,
      discount,
      taxAmount: 0,
      totalAmount,
      notes: [
        "Imported from Shopify",
        `Order ID: ${externalOrder.id}`,
        externalOrder.financial_status
          ? `Financial: ${externalOrder.financial_status}`
          : null,
        externalOrder.fulfillment_status
          ? `Fulfillment: ${externalOrder.fulfillment_status}`
          : null,
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
      externalOrderNumber: String(externalOrder.order_number),
      externalCustomerId:
        externalOrder.customer?.email ??
        externalOrder.customer?.phone ??
        externalOrder.contact_email ??
        null,
      externalPaymentId: externalOrder.financial_status ?? null,
      externalStatus:
        externalOrder.fulfillment_status ?? externalOrder.financial_status ?? null,
      paymentStatus: externalOrder.financial_status ?? null,
      metadata: JSON.stringify({
        discounts: discount,
        shipping,
        total: totalAmount,
        fulfillmentStatus: externalOrder.fulfillment_status ?? null,
      }),
      lastSyncedAt: new Date(),
    },
  });

  return { invoice, created: true, alreadyImported: false };
}
