"use server";

import { createServerAction } from "@/lib/actions/builder";
import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";

import * as service from "./service";

export async function getSalesChannels() {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getSalesChannels(db);
}

export async function getSalesChannelById(id: string) {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getSalesChannelById(db, id);
}

export async function getSalesChannelsByType(type: "DARAZ" | "SHOPIFY" | "WOOCOMMERCE" | "CSV") {
  const channels = await getSalesChannels();
  return channels.filter((channel) => channel.type === type);
}

export async function getSalesChannelLogs(channelId: string) {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getSyncLogs(db, channelId);
}

export const connectSalesChannel = createServerAction({
  label: "ConnectSalesChannel",
  permissions: ["settings.manage"],
  planGate: { limit: "maxIntegrations" },
  schema: service.connectChannelSchema,
  audit: {
    action: "CONNECT_SALES_CHANNEL",
    entityType: "SalesChannel",
    getEntityId: (result) => result.channel.id,
    getDetails: (input, result) =>
      `${result.connection.success ? "Connected" : "Updated"} ${input.type} channel "${input.name}"`,
  },
  handler: async ({ input, context }) => {
    return service.connectChannel(context.db, input);
  },
});

export const testSalesChannelConnection = createServerAction({
  label: "TestSalesChannelConnection",
  permissions: ["settings.manage"],
  schema: service.channelIdSchema,
  audit: {
    action: "TEST_SALES_CHANNEL_CONNECTION",
    entityType: "SalesChannel",
    getEntityId: (result) => result.channelId,
    getDetails: (input, result) => `Connection test for channel ${input.channelId}: ${result.result.message}`,
  },
  handler: async ({ input, context }) => {
    const result = await service.testChannelConnection(context.db, input.channelId);
    return { channelId: input.channelId, result };
  },
});

export const syncSalesChannelProducts = createServerAction({
  label: "SyncSalesChannelProducts",
  permissions: ["settings.manage", "products.view"],
  schema: service.channelIdSchema,
  audit: {
    action: "SYNC_SALES_CHANNEL_PRODUCTS",
    entityType: "SalesChannel",
    getEntityId: (result) => result.channelId,
    getDetails: (input, result) => `Product sync for channel ${input.channelId}: ${result.result.message}`,
  },
  handler: async ({ input, context }) => {
    const result = await service.syncProducts(context.db, input.channelId);
    return { channelId: input.channelId, result };
  },
});

export const syncSalesChannelOrders = createServerAction({
  label: "SyncSalesChannelOrders",
  permissions: ["settings.manage", "sales.view"],
  schema: service.channelIdSchema,
  audit: {
    action: "SYNC_SALES_CHANNEL_ORDERS",
    entityType: "SalesChannel",
    getEntityId: (result) => result.channelId,
    getDetails: (input, result) => `Order sync for channel ${input.channelId}: ${result.result.message}`,
  },
  handler: async ({ input, context }) => {
    const result = await service.syncOrders(context.db, input.channelId);
    return { channelId: input.channelId, result };
  },
});

export const pushSalesChannelInventory = createServerAction({
  label: "PushSalesChannelInventory",
  permissions: ["settings.manage", "products.view"],
  schema: service.channelIdSchema,
  audit: {
    action: "PUSH_SALES_CHANNEL_INVENTORY",
    entityType: "SalesChannel",
    getEntityId: (result) => result.channelId,
    getDetails: (input, result) => `Inventory push for channel ${input.channelId}: ${result.result.message}`,
  },
  handler: async ({ input, context }) => {
    const result = await service.pushInventory(context.db, input.channelId);
    return { channelId: input.channelId, result };
  },
});

export const getSalesChannelSyncLogs = createServerAction({
  label: "GetSalesChannelSyncLogs",
  permissions: ["settings.manage"],
  schema: service.channelIdSchema,
  enforceBilling: false,
  handler: async ({ input, context }) => {
    return service.getSyncLogs(context.db, input.channelId);
  },
});
