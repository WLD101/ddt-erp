import "server-only";

import { ScopedPrisma } from "@/lib/db/client";

import { mockDarazProducts } from "./mock";
import { requestDaraz, resolveDarazChannelContext, isDarazDemoMode } from "./client";
import {
  DarazCategoryMapping,
  DarazCreateProductPayload,
  DarazCreateProductResponse,
  DarazPublishProductRow,
  DarazPublishResult,
  DarazPublishValidation,
} from "./types";

const DARAZ_PRODUCT_CREATE_PATH = "/product/create";

function parseMapMetadata(metadata: string | null | undefined) {
  if (!metadata) {
    return {};
  }

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getDefaultBranchInventoryQuantity(
  inventoryItems: Array<{ quantity: number }>
) {
  return inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
}

function normalizeCategoryKey(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function resolveDemoCategoryMapping(categoryName: string | null): DarazCategoryMapping | null {
  const key = normalizeCategoryKey(categoryName);

  if (!key) {
    return null;
  }

  const demoMappings: Record<string, DarazCategoryMapping> = {
    electronics: {
      primaryCategory: "10000340",
      attributes: {
        brand: "Northstar",
        warranty_type: "No Warranty",
      },
    },
    accessories: {
      primaryCategory: "10000337",
      attributes: {
        brand: "Northstar",
        warranty_type: "No Warranty",
      },
    },
    cables: {
      primaryCategory: "10000347",
      attributes: {
        brand: "Northstar",
        warranty_type: "No Warranty",
      },
    },
  };

  return demoMappings[key] ?? null;
}

function resolveCategoryMapping(
  product: {
    name: string;
    category: { name: string | null } | null;
  },
  config: ReturnType<typeof resolveDarazChannelContext>["config"],
  demoMode: boolean
) {
  const categoryName = product.category?.name ?? null;
  const categoryMappings = config.categoryMappings ?? {};
  const directMapping =
    (categoryName ? categoryMappings[categoryName] : undefined) ||
    (categoryName
      ? Object.entries(categoryMappings).find(
          ([key]) => normalizeCategoryKey(key) === normalizeCategoryKey(categoryName)
        )?.[1]
      : undefined);

  if (directMapping?.primaryCategory) {
    return directMapping;
  }

  if (config.defaultCategoryExternalId) {
    return {
      primaryCategory: config.defaultCategoryExternalId,
      attributes: config.defaultAttributes ?? {},
      imageUrl: config.defaultImageUrl,
      description: config.defaultProductDescription,
    };
  }

  if (demoMode) {
    return resolveDemoCategoryMapping(categoryName);
  }

  return null;
}

function buildPublishValidation(
  product: {
    name: string;
    sku: string | null;
    unitPrice: number;
    category: { name: string | null } | null;
  },
  quantity: number,
  mappingStatus: DarazPublishValidation["mappingStatus"],
  config: ReturnType<typeof resolveDarazChannelContext>["config"],
  demoMode: boolean
): DarazPublishValidation {
  const missingFields: string[] = [];
  const categoryMapping = resolveCategoryMapping(product, config, demoMode);
  const description =
    categoryMapping?.description ||
    config.defaultProductDescription ||
    `${product.name} published from the ERP catalog.`;
  const imageUrls = [categoryMapping?.imageUrl, config.defaultImageUrl].filter(Boolean) as string[];
  const attributes = categoryMapping?.attributes ?? {};

  if (!product.sku?.trim()) {
    missingFields.push("SKU");
  }

  if (!product.unitPrice || product.unitPrice <= 0) {
    missingFields.push("Price");
  }

  if (!quantity || quantity <= 0) {
    missingFields.push("Stock quantity");
  }

  if (!categoryMapping?.primaryCategory) {
    missingFields.push("Daraz category mapping");
  }

  if (!Object.keys(attributes).length) {
    missingFields.push("Required Daraz attributes");
  }

  return {
    canPublish: missingFields.length === 0,
    missingFields,
    categoryStatus: categoryMapping?.primaryCategory ? "READY" : "MISSING",
    mappingStatus,
    primaryCategory: categoryMapping?.primaryCategory ?? null,
    attributes,
    description,
    imageUrls,
  };
}

function toMappingStatus(
  map: any
): DarazPublishValidation["mappingStatus"] {
  if (!map) {
    return "NOT_MAPPED";
  }

  const metadata = parseMapMetadata(map.metadata);
  if (metadata.demoPublished === true) {
    return "DEMO_PUBLISHED";
  }

  if (metadata.publishSource === "product-create") {
    return "PUBLISHED";
  }

  return "MAPPED";
}

function buildDarazCreatePayload(
  product: {
    name: string;
    sku: string | null;
    unitPrice: number;
  },
  quantity: number,
  validation: DarazPublishValidation
): DarazCreateProductPayload {
  return {
    primary_category: validation.primaryCategory || "",
    name: product.name,
    description: validation.description || product.name,
    attributes: validation.attributes,
    images: validation.imageUrls.length > 0 ? validation.imageUrls : undefined,
    skus: [
      {
        SellerSku: product.sku || "",
        quantity,
        price: product.unitPrice.toFixed(2),
      },
    ],
  };
}

function extractExternalProductId(
  response: DarazCreateProductResponse,
  fallbackSku: string | null,
  productId: string
) {
  const value =
    response.data?.product_id ??
    response.data?.item_id ??
    fallbackSku ??
    `daraz-${productId}`;

  return String(value);
}

async function createChannelLog(
  db: ScopedPrisma,
  channelId: string,
  status: "SUCCESS" | "FAILED",
  message: string,
  metadata?: Record<string, unknown>
) {
  await db.salesChannelSyncLog.create({
    data: {
      organizationId: db.organizationId,
      salesChannelId: channelId,
      direction: "OUTBOUND",
      entityType: "PRODUCTS",
      status,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
      finishedAt: new Date(),
    },
  });

  await db.salesChannel.update({
    where: { id: channelId },
    data: {
      syncStatus: status,
      syncError: status === "FAILED" ? message : null,
      lastSyncAt: new Date(),
    },
  });
}

export async function getDarazPublishProductRows(
  db: ScopedPrisma,
  channelId: string,
  branchId: string
): Promise<DarazPublishProductRow[]> {
  const channel = await db.salesChannel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      configuration: true,
      credentialsEncrypted: true,
    },
  });

  if (!channel) {
    return [];
  }

  const { config, credentials } = resolveDarazChannelContext(channel);
  const demoMode = isDarazDemoMode(config, credentials);

  const products = await db.product.findMany({
    include: {
      category: {
        select: {
          name: true,
        },
      },
      inventoryItems: {
        where: {
          branchId,
        },
        select: {
          quantity: true,
        },
      },
      externalProductMaps: {
        where: {
          salesChannelId: channelId,
        },
        select: {
          externalProductId: true,
          externalSku: true,
          metadata: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 30,
  });

  return products.map((product) => {
    const quantity = getDefaultBranchInventoryQuantity(product.inventoryItems);
    const existingMap = product.externalProductMaps[0] ?? null;
    const mappingStatus = toMappingStatus(existingMap);
    const validation = buildPublishValidation(product, quantity, mappingStatus, config, demoMode);

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.unitPrice,
      stockQuantity: quantity,
      categoryName: product.category?.name ?? null,
      mappingStatus: validation.mappingStatus,
      categoryStatus: validation.categoryStatus,
      missingFields: validation.missingFields,
      canPublish: validation.canPublish,
      externalProductId: existingMap?.externalProductId ?? null,
      externalSku: existingMap?.externalSku ?? null,
      validationLabel: validation.canPublish ? "Ready to publish" : `Missing: ${validation.missingFields.join(", ")}`,
    };
  });
}

export async function createDarazProduct(
  db: ScopedPrisma,
  channelId: string,
  internalProductId: string,
  branchId: string
): Promise<DarazPublishResult> {
  const channel = await db.salesChannel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      name: true,
      configuration: true,
      credentialsEncrypted: true,
    },
  });

  if (!channel) {
    throw new Error("Daraz channel not found for this organization.");
  }

  const product = await db.product.findUnique({
    where: { id: internalProductId },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      inventoryItems: {
        where: {
          branchId,
        },
        select: {
          quantity: true,
        },
      },
      externalProductMaps: {
        where: {
          salesChannelId: channelId,
        },
        select: {
          id: true,
          externalProductId: true,
          externalSku: true,
          metadata: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found in your organization.");
  }

  const { config, credentials, baseUrl } = resolveDarazChannelContext(channel);
  const demoMode = isDarazDemoMode(config, credentials);
  const quantity = getDefaultBranchInventoryQuantity(product.inventoryItems);
  const existingMap = product.externalProductMaps[0] ?? null;
  const mappingStatus = toMappingStatus(existingMap);
  const validation = buildPublishValidation(product, quantity, mappingStatus, config, demoMode);

  if (!validation.canPublish) {
    const message =
      validation.missingFields.includes("Daraz category mapping") ||
      validation.missingFields.includes("Required Daraz attributes")
        ? "Daraz category and required attributes must be mapped before publishing."
        : `Publish blocked. Missing: ${validation.missingFields.join(", ")}.`;

    await createChannelLog(db, channelId, "FAILED", message, {
      productId: product.id,
      missingFields: validation.missingFields,
    });

    return {
      success: false,
      demoMode,
      message,
      channelId,
      productId: product.id,
      missingFields: validation.missingFields,
    };
  }

  const payload = buildDarazCreatePayload(product, quantity, validation);
  let responseData: DarazCreateProductResponse | Record<string, unknown>;
  let externalProductId: string;

  if (demoMode) {
    const demoExternal = mockDarazProducts.find((entry) => entry.sku === product.sku);
    externalProductId = demoExternal?.id || `demo-daraz-${product.id}`;
    responseData = {
      code: "0",
      message: "Demo product published successfully.",
      data: {
        product_id: externalProductId,
        seller_sku: product.sku || undefined,
      },
      success: true,
    };
  } else {
    responseData = await requestDaraz<DarazCreateProductResponse>({
      path: DARAZ_PRODUCT_CREATE_PATH,
      credentials,
      baseUrl,
      method: "POST",
      body: payload,
    });
    externalProductId = extractExternalProductId(
      responseData,
      product.sku,
      product.id
    );
  }

  const nextMetadata = {
    ...parseMapMetadata(existingMap?.metadata),
    primaryCategory: validation.primaryCategory,
    attributes: validation.attributes,
    imageUrls: validation.imageUrls,
    publishSource: "product-create",
    demoPublished: demoMode,
    publishedAt: new Date().toISOString(),
    price: product.unitPrice,
    quantity,
  };

  if (existingMap) {
    await db.externalProductMap.update({
      where: { id: existingMap.id },
      data: {
        externalProductId,
        externalSku: product.sku,
        externalTitle: product.name,
        syncStatus: demoMode ? "DEMO_PUBLISHED" : "PUBLISHED",
        metadata: JSON.stringify(nextMetadata),
        lastSyncedAt: new Date(),
      },
    });
  } else {
    await db.externalProductMap.create({
      data: {
        organizationId: db.organizationId,
        salesChannelId: channelId,
        productId: product.id,
        externalProductId,
        externalSku: product.sku,
        externalTitle: product.name,
        syncStatus: demoMode ? "DEMO_PUBLISHED" : "PUBLISHED",
        metadata: JSON.stringify(nextMetadata),
        lastSyncedAt: new Date(),
      },
    });
  }

  const message = demoMode
    ? `${product.name} was demo-published to Daraz.`
    : `${product.name} was published to Daraz successfully.`;

  await createChannelLog(db, channelId, "SUCCESS", message, {
    productId: product.id,
    externalProductId,
    demoMode,
  });

  return {
    success: true,
    demoMode,
    message,
    channelId,
    productId: product.id,
    externalProductId,
    externalSku: product.sku ?? undefined,
    responseData,
  };
}
