export const SALES_CHANNEL_TYPES = ["DARAZ", "SHOPIFY", "WOOCOMMERCE", "CSV"] as const;
export const SALES_CHANNEL_SYNC_STATUSES = ["IDLE", "CONNECTING", "SYNCING", "SUCCESS", "FAILED"] as const;
export const SALES_CHANNEL_LOG_STATUSES = ["PENDING", "SUCCESS", "FAILED"] as const;
export const SALES_CHANNEL_LOG_DIRECTIONS = ["INBOUND", "OUTBOUND"] as const;
export const SALES_CHANNEL_ENTITIES = ["CONNECTION", "PRODUCTS", "ORDERS", "INVENTORY"] as const;

export type SalesChannelType = (typeof SALES_CHANNEL_TYPES)[number];
export type SalesChannelSyncStatus = (typeof SALES_CHANNEL_SYNC_STATUSES)[number];
export type SalesChannelLogStatus = (typeof SALES_CHANNEL_LOG_STATUSES)[number];
export type SalesChannelLogDirection = (typeof SALES_CHANNEL_LOG_DIRECTIONS)[number];
export type SalesChannelEntityType = (typeof SALES_CHANNEL_ENTITIES)[number];

export type IntegrationCredentialValue = string | number | boolean;
export type IntegrationCredentials = Record<string, IntegrationCredentialValue>;
export type IntegrationConfigValue = string | number | boolean | null;
export type IntegrationConfiguration = Record<string, IntegrationConfigValue>;

export type SyncLogEntry = {
  status: SalesChannelLogStatus;
  message: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type ConnectionResult = {
  success: boolean;
  message: string;
  details?: string[];
};

export type SyncResult = {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  logs?: SyncLogEntry[];
};

export type TenantChannelRecord = {
  id: string;
  organizationId: string;
  name: string;
  type: SalesChannelType;
  isActive: boolean;
  lastSyncAt: Date | null;
  syncStatus: string | null;
  syncError: string | null;
  configuration: IntegrationConfiguration;
};
