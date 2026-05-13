import { redirect } from "next/navigation";

import { canUseFeature } from "@/lib/billing/enforcement";
import { getCurrentTenantContext, requirePermission, requireRole, TenantForbiddenError } from "@/lib/tenant";

import { AuditLogsClient } from "./AuditLogsClient";

export default async function AuditLogsPage() {
  let featureEnabled = false;

  try {
    const ctx = await getCurrentTenantContext();
    requirePermission(ctx, "audit.view");
    requireRole(ctx, "owner", "admin");
    featureEnabled = await canUseFeature(ctx.organizationId, "auditLogs");
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      redirect("/settings");
    }
    throw error;
  }

  return <AuditLogsClient featureEnabled={featureEnabled} />;
}
