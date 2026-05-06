import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import {
  getSalesChannelLogsQuery,
  getSalesChannelsByTypeQuery,
} from "@/modules/integrations/queries";

import { ShopifySettingsClient } from "./ShopifySettingsClient";

export default async function ShopifyIntegrationPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const channels = await getSalesChannelsByTypeQuery("SHOPIFY");
  const channel = channels.find((entry) => entry.type === "SHOPIFY") ?? null;
  const logs = channel ? await getSalesChannelLogsQuery(channel.id) : null;

  return <ShopifySettingsClient initialChannel={channel as any} initialLogs={logs as any} />;
}
