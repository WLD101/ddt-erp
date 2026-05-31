import { redirect } from "next/navigation";

import { canUseFeature } from "@/lib/billing/enforcement";
import { getCurrentTenantContext, requirePermission, TenantForbiddenError } from "@/lib/tenant";

import { AuditLogsClient } from "./AuditLogsClient";

export default async function AuditLogsPage() {
  let featureEnabled = false;
  let canExportAudit = false;
  let canUseDeveloperFormats = false;

  try {
    const ctx = await getCurrentTenantContext();
    requirePermission(ctx, "audit.view");
    featureEnabled = await canUseFeature(ctx.organizationId, "auditLogs");
    canExportAudit = ctx.role === "owner" || ctx.permissions.includes("audit.export");
    canUseDeveloperFormats = ["owner", "admin"].includes(ctx.role);
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      redirect("/dashboard/customers");
    }
    throw error;
  }

  return (
    <AuditLogsClient
      featureEnabled={featureEnabled}
      canExportAudit={canExportAudit}
      canUseDeveloperFormats={canUseDeveloperFormats}
    />
  );
}
