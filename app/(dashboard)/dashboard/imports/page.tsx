import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getImportDashboardData } from "@/modules/imports/actions";

import { ImportsClient } from "./ImportsClient";

export default async function ImportsPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const data = await getImportDashboardData();

  return <ImportsClient initialData={data as any} />;
}
