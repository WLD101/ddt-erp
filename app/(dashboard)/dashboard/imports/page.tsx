import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getImportDashboardData } from "@/modules/imports/actions";
import { isImportType } from "@/modules/imports/service";

import { ImportsClient } from "./ImportsClient";

export default async function ImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const resolvedSearchParams = await searchParams;
  const requestedType = resolvedSearchParams.type?.toUpperCase();
  const initialImportType = requestedType && isImportType(requestedType) ? requestedType : "PRODUCTS";

  const data = await getImportDashboardData();

  return <ImportsClient initialData={data as any} initialImportType={initialImportType} />;
}
