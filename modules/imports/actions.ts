"use server";

import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";

import { ImportPayload, getImportFieldDefinitions, getImportTemplates, getRecentImportJobs, isImportType, runImport } from "./service";

export async function getImportDashboardData() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const db = getTenantStore(ctx);

  const [jobs, fields] = await Promise.all([
    getRecentImportJobs(db),
    Promise.resolve(getImportFieldDefinitions()),
  ]);

  return {
    jobs,
    fields,
    templates: getImportTemplates(),
  };
}

export async function runImportJob(payload: ImportPayload) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const db = getTenantStore(ctx);

  if (!isImportType(payload.importType)) {
    return { success: false as const, error: "Unsupported import type." };
  }

  try {
    const result = await runImport(db, payload, ctx.userId);
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Import failed.",
    };
  }
}
