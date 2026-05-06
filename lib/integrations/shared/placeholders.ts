import {
  ConnectionResult,
  SalesChannelType,
  SyncLogEntry,
  SyncResult,
} from "./types";

const LABELS: Record<SalesChannelType, string> = {
  DARAZ: "Daraz Pakistan",
  SHOPIFY: "Shopify",
  WOOCOMMERCE: "WooCommerce",
  CSV: "CSV / Excel",
};

export function buildConnectionResult(
  type: SalesChannelType,
  success: boolean,
  message: string,
  details: string[] = []
): ConnectionResult {
  return {
    success,
    message: `${LABELS[type]}: ${message}`,
    details,
  };
}

export function buildSyncResult(
  type: SalesChannelType,
  entity: "products" | "orders" | "inventory",
  message: string,
  overrides: Partial<SyncResult> = {}
): SyncResult {
  return {
    success: true,
    message: `${LABELS[type]} ${entity} sync: ${message}`,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    logs: [],
    ...overrides,
  };
}

export function buildPlaceholderLogs(type: SalesChannelType, notes: string[]): SyncLogEntry[] {
  return notes.map((message) => ({
    status: "SUCCESS",
    message: `${LABELS[type]}: ${message}`,
  }));
}
