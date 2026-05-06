import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getAllSalesChannelsQuery } from "@/modules/integrations/queries";
import { getImportOverviewQuery } from "@/modules/imports/queries";

import { IntegrationsDashboardClient } from "./IntegrationsDashboardClient";

export default async function IntegrationsOverviewPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const [channels, importJobs] = await Promise.all([
    getAllSalesChannelsQuery(),
    getImportOverviewQuery(),
  ]);

  return (
    <IntegrationsDashboardClient
      channels={channels}
      importJobs={importJobs as any}
    />
  );
}
