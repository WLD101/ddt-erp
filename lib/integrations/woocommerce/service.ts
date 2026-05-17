import { ChannelAdapterContext } from "../shared/contracts";
import { buildConnectionResult } from "../shared/placeholders";
import { ConnectionResult, SyncLogEntry, SyncResult } from "../shared/types";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { parseSafeExternalUrl } from "@/lib/security/outbound-url";

import { DEFAULT_WOO_API_SUFFIX, WOO_ENDPOINTS } from "./constants";
import { mapWooOrderToSalesInvoice, mapWooProductToProduct } from "./mapper";
import { mockWooOrders, mockWooProducts, mockWooSystemStatus } from "./mock";
import { WooConfig, WooCredentials, WooOrder, WooProduct, WooSystemStatus } from "./types";

function toWooCredentials(raw: Record<string, unknown>): WooCredentials {
  return {
    storeUrl: String(raw.storeUrl ?? ""),
    consumerKey: String(raw.consumerKey ?? ""),
    consumerSecret: String(raw.consumerSecret ?? ""),
  };
}

function toWooConfig(raw: Record<string, unknown>): WooConfig {
  return {
    useMock: typeof raw.useMock === "boolean" ? raw.useMock : undefined,
  };
}

function isWooMockMode(credentials: WooCredentials, config: WooConfig) {
  if (isDemoModeEnabled()) {
    return true;
  }

  if (typeof config.useMock === "boolean") {
    return config.useMock;
  }

  if (!credentials.storeUrl || !credentials.consumerKey || !credentials.consumerSecret) {
    return true;
  }

  return process.env.WOOCOMMERCE_MOCK_MODE !== "false";
}

function normalizeStoreUrl(storeUrl: string) {
  if (!storeUrl) {
    throw new Error("Store URL is required.");
  }

  const url = parseSafeExternalUrl(storeUrl, {
    allowHttp: true,
    label: "WooCommerce store URL",
  });

  url.pathname = `${url.pathname.replace(/\/$/, "")}${DEFAULT_WOO_API_SUFFIX}`;
  return url.toString().replace(/\/$/, "");
}

function validateWooCredentials(credentials: WooCredentials, config: WooConfig) {
  if (isWooMockMode(credentials, config)) {
    const storeUrl = credentials.storeUrl ? normalizeStoreUrl(credentials.storeUrl) : "https://demo-store.local/wp-json/wc/v3";
    return buildConnectionResult("WOOCOMMERCE", true, `Mock mode ready for ${storeUrl}.`, [
      "WooCommerce mock mode is enabled so the dashboard can demonstrate the sync flow without live keys.",
    ]);
  }

  const missing = [
    !credentials.storeUrl && "storeUrl",
    !credentials.consumerKey && "consumerKey",
    !credentials.consumerSecret && "consumerSecret",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return buildConnectionResult("WOOCOMMERCE", false, `Missing required credentials: ${missing.join(", ")}.`, [
      "WooCommerce requires storeUrl, consumerKey, and consumerSecret for live sync.",
    ]);
  }

  const normalizedUrl = normalizeStoreUrl(credentials.storeUrl);
  return buildConnectionResult("WOOCOMMERCE", true, `Ready to reach ${normalizedUrl}.`, [
    "REST API credentials are stored securely on the server.",
  ]);
}

async function fetchWooResource<T>(
  context: ChannelAdapterContext,
  resource: keyof typeof WOO_ENDPOINTS,
  query: Record<string, string | number> = {}
): Promise<T> {
  const credentials = toWooCredentials(context.credentials);
  const config = toWooConfig(context.configuration);

  if (isWooMockMode(credentials, config)) {
    if (resource === "systemStatus") return mockWooSystemStatus as T;
    if (resource === "products") return mockWooProducts as T;
    if (resource === "orders") return mockWooOrders as T;
  }

  const url = new URL(`${normalizeStoreUrl(credentials.storeUrl)}${WOO_ENDPOINTS[resource]}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  const token = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString("base64");
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("WooCommerce rejected the API keys. Check consumer key and secret.");
  }
  if (response.status === 403) {
    throw new Error("WooCommerce permission denied. Confirm the API key has read/write access.");
  }
  if (response.status === 404) {
    throw new Error("WooCommerce endpoint not found. Confirm the store URL points to a WordPress/WooCommerce site.");
  }
  if (response.status === 429) {
    throw new Error("WooCommerce rate limit reached. Please retry in a few moments.");
  }
  if (!response.ok) {
    throw new Error(`WooCommerce request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function testWooConnection(context: ChannelAdapterContext): Promise<ConnectionResult> {
  const credentials = toWooCredentials(context.credentials);
  const config = toWooConfig(context.configuration);
  const validation = validateWooCredentials(credentials, config);
  if (!validation.success) {
    return validation;
  }

  try {
    const status = await fetchWooResource<WooSystemStatus>(context, "systemStatus");
    const homeUrl = status.environment?.home_url || credentials.storeUrl || "demo store";
    return buildConnectionResult("WOOCOMMERCE", true, `Connected to ${homeUrl}.`, [
      status.environment?.version ? `WooCommerce version: ${status.environment.version}` : "WooCommerce API reachable.",
      isWooMockMode(credentials, config)
        ? "Response generated from mock mode for demo safety."
        : "Live WooCommerce system status received.",
    ]);
  } catch (error) {
    return buildConnectionResult(
      "WOOCOMMERCE",
      false,
      error instanceof Error ? error.message : "WooCommerce connection failed.",
      ["Verify the store URL, API keys, and key permissions before retrying."]
    );
  }
}

export async function syncWooProducts(context: ChannelAdapterContext): Promise<SyncResult> {
  const products = await fetchWooResource<WooProduct[]>(context, "products", {
    per_page: 50,
  });
  const logs: SyncLogEntry[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const externalProduct of products) {
    try {
      const mapped = await mapWooProductToProduct(context.db, context.channel.id, externalProduct);
      if (mapped.created) {
        created += 1;
      } else {
        updated += 1;
      }
      logs.push({
        status: "SUCCESS",
        message: `Mapped Woo product ${externalProduct.sku || externalProduct.id} to ERP product ${mapped.product.name}.`,
      });
    } catch (error) {
      skipped += 1;
      const message = error instanceof Error ? error.message : "Unknown product sync failure.";
      errors.push(message);
      logs.push({
        status: "FAILED",
        message: `Failed to import Woo product ${externalProduct.sku || externalProduct.id}: ${message}`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Processed ${products.length} WooCommerce products for ${context.channel.name}.`,
    created,
    updated,
    skipped,
    errors,
    logs,
  };
}

export async function syncWooOrders(context: ChannelAdapterContext): Promise<SyncResult> {
  const orders = await fetchWooResource<WooOrder[]>(context, "orders", {
    per_page: 50,
  });
  const logs: SyncLogEntry[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const externalOrder of orders) {
    try {
      const mapped = await mapWooOrderToSalesInvoice(context.db, context.channel.id, externalOrder);
      if (mapped.created) {
        created += 1;
      } else {
        updated += 1;
      }
      logs.push({
        status: "SUCCESS",
        message: mapped.alreadyImported
          ? `Woo order ${externalOrder.number} was already imported and has been refreshed.`
          : `Mapped Woo order ${externalOrder.number} to ERP invoice ${mapped.invoice.invoiceNumber}.`,
      });
    } catch (error) {
      skipped += 1;
      const message = error instanceof Error ? error.message : "Unknown order sync failure.";
      errors.push(message);
      logs.push({
        status: "FAILED",
        message: `Failed to import Woo order ${externalOrder.number}: ${message}`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Processed ${orders.length} WooCommerce orders for ${context.channel.name}.`,
    created,
    updated,
    skipped,
    errors,
    logs,
  };
}

export async function pushWooInventory(context: ChannelAdapterContext): Promise<SyncResult> {
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
      message: "No mapped WooCommerce products found. Map products before pushing inventory.",
      created: 0,
      updated: 0,
      skipped: 0,
      errors: ["No mapped products available for WooCommerce inventory push."],
      logs: [],
    };
  }

  const credentials = toWooCredentials(context.credentials);
  const config = toWooConfig(context.configuration);
  const logs: SyncLogEntry[] = [];
  const errors: string[] = [];
  let updated = 0;
  let skipped = 0;

  for (const map of mappedProducts) {
    const quantity = map.product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const sku = map.externalSku || map.product.sku;

    if (!sku) {
      skipped += 1;
      logs.push({
        status: "FAILED",
        message: `Skipped ${map.product.name} because neither the Woo map nor ERP product has an SKU.`,
      });
      errors.push(`Missing SKU for ${map.product.name}.`);
      continue;
    }

    try {
      if (!isWooMockMode(credentials, config)) {
        const url = new URL(`${normalizeStoreUrl(credentials.storeUrl)}${WOO_ENDPOINTS.products}/${map.externalProductId}`);
        const token = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString("base64");
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify({
            sku,
            manage_stock: true,
            stock_quantity: quantity,
            stock_status: quantity > 0 ? "instock" : "outofstock",
          }),
        });

        if (response.status === 401) {
          throw new Error("WooCommerce rejected the API keys during inventory update.");
        }
        if (response.status === 403) {
          throw new Error("WooCommerce permission denied during inventory update.");
        }
        if (response.status === 404) {
          throw new Error(`WooCommerce product ${map.externalProductId} was not found.`);
        }
        if (response.status === 429) {
          throw new Error("WooCommerce rate limit reached during inventory push.");
        }
        if (!response.ok) {
          throw new Error(`WooCommerce inventory update failed for ${sku}.`);
        }
      }

      updated += 1;
      logs.push({
        status: "SUCCESS",
        message: `Pushed stock ${quantity} for ${map.product.name} (${sku}).`,
      });
    } catch (error) {
      skipped += 1;
      const message = error instanceof Error ? error.message : "Unknown inventory push failure.";
      errors.push(message);
      logs.push({
        status: "FAILED",
        message: `Failed to push stock for ${map.product.name}: ${message}`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Attempted WooCommerce inventory push for ${mappedProducts.length} mapped products.`,
    created: 0,
    updated,
    skipped,
    errors,
    logs,
  };
}

export async function getWooSyncLogs(context: ChannelAdapterContext): Promise<SyncLogEntry[]> {
  const credentials = toWooCredentials(context.credentials);
  const config = toWooConfig(context.configuration);
  return [
    {
      status: "SUCCESS",
      message: isWooMockMode(credentials, config)
        ? "WooCommerce adapter is running in demo-safe mock mode."
        : "WooCommerce adapter is configured for live REST API traffic.",
    },
    {
      status: "SUCCESS",
      message: credentials.storeUrl
        ? `Store URL: ${credentials.storeUrl}`
        : "No live store URL saved yet.",
    },
  ];
}
