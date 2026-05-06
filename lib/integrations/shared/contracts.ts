import { ScopedPrisma } from "@/lib/db/client";
import {
  ConnectionResult,
  IntegrationConfiguration,
  IntegrationCredentials,
  SalesChannelType,
  SyncLogEntry,
  SyncResult,
  TenantChannelRecord,
} from "./types";

export type ChannelAdapterContext = {
  db: ScopedPrisma;
  channel: TenantChannelRecord;
  credentials: IntegrationCredentials;
  configuration: IntegrationConfiguration;
};

export interface ChannelIntegrationAdapter {
  type: SalesChannelType;
  connectChannel(context: ChannelAdapterContext): Promise<ConnectionResult>;
  testConnection(context: ChannelAdapterContext): Promise<ConnectionResult>;
  syncProducts(context: ChannelAdapterContext): Promise<SyncResult>;
  syncOrders(context: ChannelAdapterContext): Promise<SyncResult>;
  pushInventory(context: ChannelAdapterContext): Promise<SyncResult>;
  getSyncLogs(context: ChannelAdapterContext): Promise<SyncLogEntry[]>;
}
