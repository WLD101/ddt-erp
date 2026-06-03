import { prisma } from "@/lib/prisma";

export async function logVoiceAction(data: {
  organizationId: string;
  voiceBusinessProfileId?: string;
  voiceAgentId?: string;
  actorUserId?: string;
  actorRole?: string;
  action: string;
  status?: string;
  summary?: string;
  metadataJson?: string;
}) {
  return prisma.voiceActionAuditLog.create({
    data: {
      organizationId: data.organizationId,
      voiceBusinessProfileId: data.voiceBusinessProfileId,
      voiceAgentId: data.voiceAgentId,
      actorUserId: data.actorUserId,
      actorRole: data.actorRole,
      action: data.action,
      status: data.status || "SUCCESS",
      summary: data.summary,
      metadataJson: data.metadataJson,
    },
  });
}

export async function getVoiceAuditLogs({
  organizationId,
  limit = 50,
}: {
  organizationId?: string;
  limit?: number;
}) {
  return prisma.voiceActionAuditLog.findMany({
    where: organizationId ? { organizationId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
