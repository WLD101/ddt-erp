import { ChannelAdapterContext } from "../shared/contracts";
import { ConnectionResult, SyncLogEntry, SyncResult } from "../shared/types";
import { buildConnectionResult } from "../shared/placeholders";
import { isDemoModeEnabled } from "@/lib/demo-mode";

import { DEFAULT_DARAZ_API_BASE_URL, DARAZ_ENDPOINTS } from "./constants";
import { mapDarazOrderToSalesInvoice, mapDarazProductToProduct } from "./mapper";
import { mockDarazOrders, mockDarazProducts, mockDarazSellerProfile } from "./mock";
import { DarazConfig, DarazCredentials, DarazOrder, DarazProduct, DarazSellerProfile } from "./types";

function toDarazCredentials(raw: Record<string, unknown>): DarazCredentials {
  return {
    appKey: String(raw.appKey ?? ""),
    appSecret: String(raw.appSecret ?? ""),
    accessToken: String(raw.accessToken ?? ""),
    refreshToken: raw.refreshToken ? String(raw.refreshToken) : undefined,
    sellerId: String(raw.sellerId ?? ""),
  };
}

function toDarazConfig(raw: Record<string, unknown>): DarazConfig {
  return {
    apiBaseUrl: typeof raw.apiBaseUrl === "string" ? raw.apiBaseUrl : undefined,
    shopId: typeof raw.shopId === "string" ? raw.shopId : undefined,
    useMock: typeof raw.useMock === "boolean" ? raw.useMock : undefined,
  };
}

function isDarazMockMode(config: DarazConfig, credentials?: Partial<DarazCredentials>) {
  if (isDemoModeEnabled()) {
    return true;
  }

  if (typeof config.useMock === "boolean") {
    return config.useMock;
  }

  if (!credentials?.appKey || !credentials?.appSecret || !credentials?.accessToken || !credentials?.sellerId) {
    return true;
  }

  return process.env.DARAZ_MOCK_MODE !== "false";
}

function getDarazBaseUrl(config: DarazConfig) {
  return config.apiBaseUrl || DEFAULT_DARAZ_API_BASE_URL;
}

function validateDarazCredentials(credentials: DarazCredentials, config: DarazConfig) {
  if (isDarazMockMode(config, credentials)) {
    return buildConnectionResult("DARAZ", true, `Demo mode ready for ${getDarazBaseUrl(config)}.`, [
      "Daraz mock mode is enabled so client demos can show products, orders, and inventory sync without live marketplace credentials.",
    ]);
  }

  const missing = [
    !credentials.appKey && "appKey",
    !credentials.appSecret && "appSecret",
    !credentials.accessToken && "accessToken",
    !credentials.sellerId && "sellerId",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return buildConnectionResult("DARAZ", false, `Missing required credentials: ${missing.join(", ")}.`, [
      "Daraz Open Platform access requires appKey, appSecret, accessToken, and a seller identifier.",
    ]);
  }

  return buildConnectionResult("DARAZ", true, `Ready to reach ${getDarazBaseUrl(config)}.`, [
    `Seller ${credentials.sellerId} is configured for the Pakistan storefront.`,
    isDarazMockMode(config, credentials)
      ? "Mock mode is enabled for demo-safe syncs."
      : "Live mode is enabled. Confirm the endpoint constants before production rollout.",
  ]);
}

async function fetchDarazResource<T>(
  context: ChannelAdapterContext,
  resource: keyof typeof DARAZ_ENDPOINTS
): Promise<T> {
  const credentials = toDarazCredentials(context.credentials);
  const config = toDarazConfig(context.configuration);

  if (isDarazMockMode(config, credentials)) {
    if (resource === "sellerProfile") {
      return {
        ...mockDarazSellerProfile,
        sellerId: credentials.sellerId || mockDarazSellerProfile.sellerId,
        shopId: config.shopId || mockDarazSellerProfile.shopId,
      } as T;
    }

    if (resource === "products") {
      return mockDarazProducts as T;
    }

    if (resource === "orders") {
      return mockDarazOrders as T;
    }

    return [] as T;
  }

  const endpoint = DARAZ_ENDPOINTS[resource];
  const url = `${getDarazBaseUrl(config)}${endpoint}`;

  // TODO: Confirm the final Daraz PK signing requirements and query parameters for each endpoint.
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${credentials.accessToken}`,
      "X-Daraz-App-Key": credentials.appKey,
      "X-Daraz-Seller-Id": credentials.sellerId,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Daraz API request failed for ${resource}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function testDarazConnection(context: ChannelAdapterContext): Promise<ConnectionResult> {
  const credentials = toDarazCredentials(context.credentials);
  const config = toDarazConfig(context.configuration);
  const validation = validateDarazCredentials(credentials, config);
  if (!validation.success) {
    return validation;
  }

  try {
    const seller = await fetchDarazResource<DarazSellerProfile>(context, "sellerProfile");
    return buildConnectionResult("DARAZ", true, `Connected to seller ${seller.sellerId}.`, [
      seller.shopName ? `Shop: ${seller.shopName}` : "Shop profile reachable.",
      seller.shopId ? `Shop ID: ${seller.shopId}` : "No explicit shop ID returned.",
      isDarazMockMode(config)
        ? "Response generated from safe mock mode."
        : "Live response received from the Daraz adapter.",
    ]);
  } catch (error) {
    return buildConnectionResult(
      "DARAZ",
      false,
      error instanceof Error ? error.message : "Daraz connection failed.",
      ["Verify credentials, API base URL, and seller access before retrying."]
    );
  }
}

export async function syncDarazProducts(context: ChannelAdapterContext): Promise<SyncResult> {
  const products = await fetchDarazResource<DarazProduct[]>(context, "products");
  const logs: SyncLogEntry[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const externalProduct of products) {
    try {
      const mapped = await mapDarazProductToProduct(context.db, context.channel.id, externalProduct);
      if (mapped.created) {
        created += 1;
      } else {
        updated += 1;
      }
      logs.push({
        status: "SUCCESS",
        message: `Mapped Daraz product ${externalProduct.sku || externalProduct.id} to ERP product ${mapped.product.name}.`,
      });
    } catch (error) {
      skipped += 1;
      const message = error instanceof Error ? error.message : "Unknown product sync failure.";
      errors.push(message);
      logs.push({
        status: "FAILED",
        message: `Failed to map product ${externalProduct.sku || externalProduct.id}: ${message}`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Processed ${products.length} Daraz products for ${context.channel.name}.`,
    created,
    updated,
    skipped,
    errors,
    logs,
  };
}

export async function syncDarazOrders(context: ChannelAdapterContext): Promise<SyncResult> {
  const orders = await fetchDarazResource<DarazOrder[]>(context, "orders");
  const logs: SyncLogEntry[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const externalOrder of orders) {
    try {
      const mapped = await mapDarazOrderToSalesInvoice(context.db, context.channel.id, externalOrder);
      if (mapped.created) {
        created += 1;
      } else {
        updated += 1;
      }
      logs.push({
        status: "SUCCESS",
        message: `Mapped Daraz order ${externalOrder.orderNumber} to ERP invoice ${mapped.invoice.invoiceNumber}.`,
      });
    } catch (error) {
      skipped += 1;
      const message = error instanceof Error ? error.message : "Unknown order sync failure.";
      errors.push(message);
      logs.push({
        status: "FAILED",
        message: `Failed to map order ${externalOrder.orderNumber}: ${message}`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Processed ${orders.length} Daraz orders for ${context.channel.name}.`,
    created,
    updated,
    skipped,
    errors,
    logs,
  };
}

export async function pushDarazInventory(context: ChannelAdapterContext): Promise<SyncResult> {
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

  const logs: SyncLogEntry[] = [];
  const errors: string[] = [];
  let updated = 0;
  let skipped = 0;

  if (mappedProducts.length === 0) {
    return {
      success: false,
      message: "No mapped Daraz products found. Map products before pushing inventory.",
      created: 0,
      updated: 0,
      skipped: 0,
      errors: ["No mapped products available for Daraz inventory push."],
      logs: [],
    };
  }

  const config = toDarazConfig(context.configuration);
  for (const map of mappedProducts) {
    const quantity = map.product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

    try {
      if (!isDarazMockMode(config)) {
        const url = `${getDarazBaseUrl(config)}${DARAZ_ENDPOINTS.inventory}`;
        // TODO: Replace with the final Daraz stock update payload and signing flow.
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${toDarazCredentials(context.credentials).accessToken}`,
            "X-Daraz-App-Key": toDarazCredentials(context.credentials).appKey,
            "X-Daraz-Seller-Id": toDarazCredentials(context.credentials).sellerId,
          },
          body: JSON.stringify({
            productId: map.externalProductId,
            sellerSku: map.externalSku,
            quantity,
          }),
        });

        if (!response.ok) {
          throw new Error(`Daraz inventory update failed for ${map.externalSku || map.externalProductId}.`);
        }
      }

      updated += 1;
      logs.push({
        status: "SUCCESS",
        message: `Pushed stock ${quantity} for ${map.product.name} (${map.externalSku || map.externalProductId}).`,
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
    message: `Attempted Daraz inventory push for ${mappedProducts.length} mapped products.`,
    created: 0,
    updated,
    skipped,
    errors,
    logs,
  };
}

export async function getDarazSyncLogs(context: ChannelAdapterContext): Promise<SyncLogEntry[]> {
  const config = toDarazConfig(context.configuration);
  return [
    {
      status: "SUCCESS",
      message: isDarazMockMode(config)
        ? "Daraz adapter is running in demo-safe mock mode."
        : "Daraz adapter is configured for live API traffic.",
    },
    {
      status: "SUCCESS",
      message: `Using API base URL ${getDarazBaseUrl(config)}.`,
    },
  ];
}
