import { prisma } from "@/lib/prisma";

type ProjectionDb = Pick<typeof prisma, "callRoute" | "callLog">;

export async function createLegacyRouteProjection(input: {
  callId: string;
  tenantId: string;
  fromNumber: string | null;
  toNumber: string;
  detectedCountry: string;
  selectedProviderId: string;
  routeReason: string;
  status: string;
  db?: ProjectionDb;
}) {
  const db = input.db || prisma;
  return db.callRoute.create({
    data: {
      callId: input.callId,
      tenantId: input.tenantId,
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      detectedCountry: input.detectedCountry,
      selectedProviderId: input.selectedProviderId,
      routeReason: input.routeReason,
      status: input.status,
    },
  });
}

export async function upsertLegacyCallLogProjection(input: {
  callId: string;
  callAttemptId: string;
  tenantId: string;
  providerId: string;
  externalCallId: string;
  fromNumber: string | null;
  toNumber: string;
  direction: string;
  country: string | null;
  callStatus: string;
  duration?: number | null;
  recordingUrl?: string | null;
  transcriptId?: string | null;
  cost?: number | null;
  currency?: string | null;
  db?: ProjectionDb;
}) {
  const db = input.db || prisma;
  return db.callLog.upsert({
    where: {
      providerId_externalCallId: {
        providerId: input.providerId,
        externalCallId: input.externalCallId,
      },
    },
    update: {
      callId: input.callId,
      callAttemptId: input.callAttemptId,
      tenantId: input.tenantId,
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      direction: input.direction,
      country: input.country || undefined,
      callStatus: input.callStatus,
      duration: input.duration ?? undefined,
      recordingUrl: input.recordingUrl || undefined,
      transcriptId: input.transcriptId || undefined,
      cost: typeof input.cost === "number" ? input.cost : undefined,
      currency: input.currency || undefined,
    },
    create: {
      callId: input.callId,
      callAttemptId: input.callAttemptId,
      tenantId: input.tenantId,
      providerId: input.providerId,
      externalCallId: input.externalCallId,
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      direction: input.direction,
      country: input.country,
      callStatus: input.callStatus,
      duration: input.duration ?? undefined,
      recordingUrl: input.recordingUrl || undefined,
      transcriptId: input.transcriptId || undefined,
      cost: typeof input.cost === "number" ? input.cost : undefined,
      currency: input.currency || undefined,
    },
  });
}
