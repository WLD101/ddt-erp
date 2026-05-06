import { getTenantStore } from "@/lib/db/client";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getDarazPublishProductRows } from "@/lib/integrations/daraz/product-create";
import { getSalesChannelLogsQuery, getSalesChannelsByTypeQuery } from "@/modules/integrations/queries";

import { DarazSettingsClient } from "./DarazSettingsClient";

export default async function DarazIntegrationPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const channels = await getSalesChannelsByTypeQuery("DARAZ");
  const channel = channels.find((entry) => entry.type === "DARAZ") ?? null;
  const logs = channel ? await getSalesChannelLogsQuery(channel.id) : null;
  const db = getTenantStore(ctx);
  const productRows = channel ? await getDarazPublishProductRows(db, channel.id, ctx.branchId) : [];

  return <DarazSettingsClient initialChannel={channel as any} initialLogs={logs as any} productRows={productRows} />;
}
