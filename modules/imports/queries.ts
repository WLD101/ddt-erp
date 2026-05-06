import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";

import { getRecentImportJobs } from "./service";

export async function getImportOverviewQuery() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const db = getTenantStore(ctx);

  return getRecentImportJobs(db);
}
