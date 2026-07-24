import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { listIntegrationProvidersForTenant, listTenantConnections } from "@/modules/integrations/foundation-service";
import { getAllSalesChannelsQuery } from "@/modules/integrations/queries";
import { getImportOverviewQuery } from "@/modules/imports/queries";

import { IntegrationMarketplacePanel } from "./IntegrationMarketplacePanel";
import { IntegrationsDashboardClient } from "./IntegrationsDashboardClient";

export default async function IntegrationsOverviewPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const db = getTenantStore(ctx);
  const organization = await db.organization.findUnique({
    where: { id: db.organizationId },
    select: { industryProfileKey: true },
  });

  const [providers, connections, channels, importJobs] = await Promise.all([
    listIntegrationProvidersForTenant(db, {
      industryProfileKey: (organization?.industryProfileKey as never) || undefined,
    }),
    listTenantConnections(db),
    getAllSalesChannelsQuery(),
    getImportOverviewQuery(),
  ]);

  return (
    <div className="space-y-12">
      <IntegrationMarketplacePanel providers={providers as any} connections={connections as any} />
      <IntegrationsDashboardClient
        channels={channels}
        importJobs={importJobs as any}
      />
    </div>
  );
}
