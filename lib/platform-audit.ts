import { prisma } from "@/lib/prisma";

export async function writePlatformAuditLog(params: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: string | null;
}) {
  return prisma.platformAuditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details ?? null,
    },
  });
}
