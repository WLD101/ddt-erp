import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getSalesChannelLogsQuery, getSalesChannelsByTypeQuery } from "@/modules/integrations/queries";

import { WooCommerceSettingsClient } from "./WooCommerceSettingsClient";

export default async function WooCommerceIntegrationPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const channels = await getSalesChannelsByTypeQuery("WOOCOMMERCE");
  const channel = channels.find((entry) => entry.type === "WOOCOMMERCE") ?? null;
  const logs = channel ? await getSalesChannelLogsQuery(channel.id) : null;

  return <WooCommerceSettingsClient initialChannel={channel as any} initialLogs={logs as any} />;
}
