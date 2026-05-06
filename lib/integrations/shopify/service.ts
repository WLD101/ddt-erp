import { ChannelAdapterContext } from "../shared/contracts";
import { buildConnectionResult } from "../shared/placeholders";
import { ConnectionResult, SyncLogEntry, SyncResult } from "../shared/types";
import { isDemoModeEnabled } from "@/lib/demo-mode";

import {
  DEFAULT_SHOPIFY_API_VERSION,
  SHOPIFY_ENDPOINTS,
} from "./constants";
import { mapShopifyOrderToSalesInvoice, mapShopifyProductToProduct } from "./mapper";
import { mockShopifyOrders, mockShopifyProducts, mockShopifyShop } from "./mock";
import {
  ShopifyConfig,
  ShopifyCredentials,
  ShopifyOrder,
  ShopifyProduct,
  ShopifyShop,
} from "./types";

function toShopifyCredentials(raw: Record<string, unknown>): ShopifyCredentials {
  return {
    shopDomain: String(raw.shopDomain ?? ""),
    adminAccessToken: String(
      raw.adminAccessToken ?? raw.accessToken ?? ""
    ),
  };
}

function toShopifyConfig(raw: Record<string, unknown>): ShopifyConfig {
  return {
    apiVersion:
      typeof raw.apiVersion === "string" ? raw.apiVersion : undefined,
    useMock: typeof raw.useMock === "boolean" ? raw.useMock : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
  };
}

function normalizeShopDomain(domain: string) {
  if (!domain) {
    throw new Error("Shop domain is required.");
  }

  const normalized = domain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  if (!normalized.includes(".")) {
    throw new Error("Invalid Shopify shop domain.");
  }

  return normalized;
}

function isShopifyMockMode(
  credentials: ShopifyCredentials,
  config: ShopifyConfig
) {
  if (isDemoModeEnabled()) {
    return true;
  }

  if (typeof config.useMock === "boolean") {
    return config.useMock;
  }

  if (!credentials.shopDomain || !credentials.adminAccessToken) {
    return true;
  }

  return process.env.SHOPIFY_MOCK_MODE !== "false";
}

function getApiVersion(config: ShopifyConfig) {
  return config.apiVersion || DEFAULT_SHOPIFY_API_VERSION;
}

function shopifyBaseUrl(credentials: ShopifyCredentials, config: ShopifyConfig) {
  return `https://${normalizeShopDomain(credentials.shopDomain)}/admin/api/${getApiVersion(
    config
  )}`;
}

function validateShopifyCredentials(
  credentials: ShopifyCredentials,
  config: ShopifyConfig
) {
  if (isShopifyMockMode(credentials, config)) {
    return buildConnectionResult(
      "SHOPIFY",
      true,
      `Demo mode ready for ${credentials.shopDomain || "shopify-demo.myshopify.com"}.`,
      [
        "Shopify demo mode is enabled so client demos can show the full integration flow without live tokens.",
      ]
    );
  }

  const missing = [
    !credentials.shopDomain && "shopDomain",
    !credentials.adminAccessToken && "adminAccessToken",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return buildConnectionResult(
      "SHOPIFY",
      false,
      `Missing required credentials: ${missing.join(", ")}.`,
      ["Shopify requires a shop domain and admin access token for live Admin API sync."]
    );
  }

  return buildConnectionResult(
    "SHOPIFY",
    true,
    `Ready to reach ${shopifyBaseUrl(credentials, config)}.`,
    [`Using Admin API version ${getApiVersion(config)}.`]
  );
}

async function fetchShopifyResource<T>(
  context: ChannelAdapterContext,
  resource: "shop" | "products" | "orders"
): Promise<T> {
  const credentials = toShopifyCredentials(context.credentials);
  const config = toShopifyConfig(context.configuration);

  if (isShopifyMockMode(credentials, config)) {
    if (resource === "shop") {
      return {
        ...mockShopifyShop,
        domain: credentials.shopDomain || mockShopifyShop.domain,
      } as T;
    }
    if (resource === "products") {
      return { products: mockShopifyProducts } as T;
    }
    if (resource === "orders") {
      return { orders: mockShopifyOrders } as T;
    }
  }

  const response = await fetch(
    `${shopifyBaseUrl(credentials, config)}${SHOPIFY_ENDPOINTS[resource]}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Shopify-Access-Token": credentials.adminAccessToken,
      },
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    throw new Error("Shopify rejected the admin access token.");
  }
  if (response.status === 403) {
    throw new Error("Shopify permission denied. Confirm the token can read products and orders.");
  }
  if (response.status === 429) {
    throw new Error("Shopify rate limit reached. Please retry shortly.");
  }
  if (!response.ok) {
    throw new Error(`Shopify request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function testShopifyConnection(
  context: ChannelAdapterContext
): Promise<ConnectionResult> {
  const credentials = toShopifyCredentials(context.credentials);
  const config = toShopifyConfig(context.configuration);
  const validation = validateShopifyCredentials(credentials, config);
  if (!validation.success) {
    return validation;
  }

  try {
    const payload = await fetchShopifyResource<{ shop: ShopifyShop }>(
      context,
      "shop"
    );
    return buildConnectionResult(
      "SHOPIFY",
      true,
      `Connected to Shopify store ${payload.shop.name}.`,
      [
        payload.shop.domain
          ? `Domain: ${payload.shop.domain}`
          : "Shop profile reachable.",
        isShopifyMockMode(credentials, config)
          ? "Response generated from clearly labeled demo data."
          : `Using Admin API version ${getApiVersion(config)}.`,
      ]
    );
  } catch (error) {
    return buildConnectionResult(
      "SHOPIFY",
      false,
      error instanceof Error ? error.message : "Shopify connection failed.",
      ["Verify the shop domain, admin token, and API version before retrying."]
    );
  }
}

export async function syncShopifyProducts(
  context: ChannelAdapterContext
): Promise<SyncResult> {
  const payload = await fetchShopifyResource<{ products: ShopifyProduct[] }>(
    context,
    "products"
  );
  const products = payload.products ?? [];
  const logs: SyncLogEntry[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const externalProduct of products) {
    if (!externalProduct.variants?.length) {
      skipped += 1;
      logs.push({
        status: "FAILED",
        message: `Skipped Shopify product ${externalProduct.title} because it has no variants.`,
      });
      errors.push(`Product ${externalProduct.title} has no variants.`);
      continue;
    }

    for (const variant of externalProduct.variants) {
      try {
        const mapped = await mapShopifyProductToProduct(
          context.db,
          context.channel.id,
          externalProduct,
          variant
        );
        if (mapped.created) {
          created += 1;
        } else {
          updated += 1;
        }
        logs.push({
          status: "SUCCESS",
          message: `Mapped Shopify variant ${variant.sku || variant.id} to ERP product ${mapped.product.name}.`,
        });
      } catch (error) {
        skipped += 1;
        const message =
          error instanceof Error ? error.message : "Unknown product sync failure.";
        errors.push(message);
        logs.push({
          status: "FAILED",
          message: `Failed to import Shopify variant ${variant.sku || variant.id}: ${message}`,
        });
      }
    }
  }

  return {
    success: errors.length === 0,
    message: `Processed ${products.length} Shopify products for ${context.channel.name}.`,
    created,
    updated,
    skipped,
    errors,
    logs,
  };
}

export async function syncShopifyOrders(
  context: ChannelAdapterContext
): Promise<SyncResult> {
  const payload = await fetchShopifyResource<{ orders: ShopifyOrder[] }>(
    context,
    "orders"
  );
  const orders = payload.orders ?? [];
  const logs: SyncLogEntry[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const externalOrder of orders) {
    try {
      const mapped = await mapShopifyOrderToSalesInvoice(
        context.db,
        context.channel.id,
        externalOrder
      );
      if (mapped.created) {
        created += 1;
      } else {
        updated += 1;
      }
      logs.push({
        status: "SUCCESS",
        message: mapped.alreadyImported
          ? `Shopify order #${externalOrder.order_number} was already imported and has been refreshed.`
          : `Mapped Shopify order #${externalOrder.order_number} to ERP invoice ${mapped.invoice.invoiceNumber}.`,
      });
    } catch (error) {
      skipped += 1;
      const message =
        error instanceof Error ? error.message : "Unknown order sync failure.";
      errors.push(message);
      logs.push({
        status: "FAILED",
        message: `Failed to import Shopify order #${externalOrder.order_number}: ${message}`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Processed ${orders.length} Shopify orders for ${context.channel.name}.`,
    created,
    updated,
    skipped,
    errors,
    logs,
  };
}

export async function pushShopifyInventory(
  context: ChannelAdapterContext
): Promise<SyncResult> {
  const mappedProducts = await context.db.externalProductMap.findMany({
    where: { salesChannelId: context.channel.id },
    include: {
      product: {
        include: {
          inventoryItems: true,
        },
      },
    },
  });

  if (mappedProducts.length === 0) {
    return {
      success: false,
      message: "No mapped Shopify variants found. Sync products before pushing inventory.",
      created: 0,
      updated: 0,
      skipped: 0,
      errors: ["No mapped Shopify variants available for inventory push."],
      logs: [],
    };
  }

  const credentials = toShopifyCredentials(context.credentials);
  const config = toShopifyConfig(context.configuration);
  const logs: SyncLogEntry[] = [];
  const errors: string[] = [];
  let updated = 0;
  let skipped = 0;

  for (const map of mappedProducts) {
    if (!map.externalVariantId) {
      skipped += 1;
      logs.push({
        status: "FAILED",
        message: `Skipped ${map.product.name} because no Shopify variant ID is mapped.`,
      });
      errors.push(`Missing Shopify variant ID for ${map.product.name}.`);
      continue;
    }

    const quantity = map.product.inventoryItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    try {
      if (!isShopifyMockMode(credentials, config)) {
        const response = await fetch(
          `${shopifyBaseUrl(credentials, config)}${SHOPIFY_ENDPOINTS.variant(
            map.externalVariantId
          )}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": credentials.adminAccessToken,
            },
            body: JSON.stringify({
              variant: {
                id: Number(map.externalVariantId),
                inventory_quantity: quantity,
              },
            }),
          }
        );

        if (response.status === 401) {
          throw new Error("Shopify rejected the admin access token during inventory update.");
        }
        if (response.status === 403) {
          throw new Error("Shopify permission denied during inventory update.");
        }
        if (response.status === 404) {
          throw new Error(`Shopify variant ${map.externalVariantId} was not found.`);
        }
        if (response.status === 429) {
          throw new Error("Shopify rate limit reached during inventory push.");
        }
        if (!response.ok) {
          throw new Error(`Shopify inventory update failed for ${map.product.name}.`);
        }
      }

      updated += 1;
      logs.push({
        status: "SUCCESS",
        message: `Pushed stock ${quantity} for ${map.product.name} to Shopify variant ${map.externalVariantId}.`,
      });
    } catch (error) {
      skipped += 1;
      const message =
        error instanceof Error
          ? error.message
          : "Unknown inventory push failure.";
      errors.push(message);
      logs.push({
        status: "FAILED",
        message: `Failed to push stock for ${map.product.name}: ${message}`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Attempted Shopify inventory push for ${mappedProducts.length} mapped variants.`,
    created: 0,
    updated,
    skipped,
    errors,
    logs,
  };
}

export async function getShopifySyncLogs(
  context: ChannelAdapterContext
): Promise<SyncLogEntry[]> {
  const credentials = toShopifyCredentials(context.credentials);
  const config = toShopifyConfig(context.configuration);
  return [
    {
      status: "SUCCESS",
      message: isShopifyMockMode(credentials, config)
        ? "Shopify adapter is running in clearly labeled demo mode."
        : "Shopify adapter is configured for live Admin API traffic.",
    },
    {
      status: "SUCCESS",
      message: `Admin API version ${getApiVersion(config)}.`,
    },
  ];
}
