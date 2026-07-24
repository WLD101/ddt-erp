import { prisma } from "@/lib/prisma";
import { logTelecomEvent } from "./observability";

export type TelecomAlertInput = {
  code: string;
  title: string;
  message: string;
  severity?: string;
  status?: string;
  organizationId?: string | null;
  providerId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
};

export async function createOrUpdateTelecomAlert(input: TelecomAlertInput) {
  const alert = await prisma.telecomOperationalAlert.upsert({
    where: { dedupeKey: input.dedupeKey },
    update: {
      status: input.status || "open",
      severity: input.severity || "warning",
      title: input.title,
      message: input.message,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      resolvedAt: input.status === "resolved" ? new Date() : null,
    },
    create: {
      organizationId: input.organizationId || null,
      providerId: input.providerId || null,
      status: input.status || "open",
      severity: input.severity || "warning",
      code: input.code,
      title: input.title,
      message: input.message,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      dedupeKey: input.dedupeKey,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });

  logTelecomEvent("alert.upserted", {
    code: input.code,
    providerId: input.providerId || null,
    tenantId: input.organizationId || null,
    entityType: input.entityType || null,
    entityId: input.entityId || null,
  });

  return alert;
}

export async function listRecentTelecomAlerts(limit = 50) {
  return prisma.telecomOperationalAlert.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}
