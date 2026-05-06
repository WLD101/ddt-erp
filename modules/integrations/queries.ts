import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";

import * as service from "./service";

export async function getAllSalesChannelsQuery() {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getSalesChannels(db);
}

export async function getSalesChannelsByTypeQuery(type: "DARAZ" | "SHOPIFY" | "WOOCOMMERCE" | "CSV") {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  const channels = await service.getSalesChannels(db);
  return channels.filter((channel) => channel.type === type);
}

export async function getSalesChannelLogsQuery(channelId: string) {
  const ctx = await getCurrentTenantContext();
  const db = getTenantStore(ctx);
  return service.getSyncLogs(db, channelId);
}
