import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type DataRetentionPolicy = {
  recordingDays: number;
  transcriptDays: number;
  webhookPayloadDays: number;
  messagingDays: number;
};

function boundedDays(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3_650) {
    return fallback;
  }
  return parsed;
}

export function resolveDataRetentionPolicy(
  env: Partial<Record<string, string | undefined>> = process.env,
): DataRetentionPolicy {
  return {
    recordingDays: boundedDays(env.VOICE_RECORDING_RETENTION_DAYS, 30),
    transcriptDays: boundedDays(env.VOICE_TRANSCRIPT_RETENTION_DAYS, 90),
    webhookPayloadDays: boundedDays(env.VOICE_WEBHOOK_PAYLOAD_RETENTION_DAYS, 30),
    messagingDays: boundedDays(env.VOICE_MESSAGING_RETENTION_DAYS, 90),
  };
}

function cutoff(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export async function applyDataRetention(now = new Date()) {
  const policy = resolveDataRetentionPolicy();
  const recordingCutoff = cutoff(now, policy.recordingDays);
  const transcriptCutoff = cutoff(now, policy.transcriptDays);
  const webhookCutoff = cutoff(now, policy.webhookPayloadDays);
  const messagingCutoff = cutoff(now, policy.messagingDays);
  const tenantPolicies = await prisma.voiceReceptionistSettings.findMany({
    select: {
      organizationId: true,
      recordingEnabled: true,
      transcriptionEnabled: true,
      recordingRetentionDays: true,
      transcriptRetentionDays: true,
    },
  });
  const configuredOrganizationIds = tenantPolicies.map(
    (item) => item.organizationId,
  );
  const tenantOperations: Prisma.PrismaPromise<Prisma.BatchPayload>[] = [];

  for (const tenantPolicy of tenantPolicies) {
    tenantOperations.push(
      prisma.voiceCallLog.updateMany({
        where: {
          organizationId: tenantPolicy.organizationId,
          recordingUrl: { not: null },
          ...(tenantPolicy.recordingEnabled
            ? {
                createdAt: {
                  lt: cutoff(
                    now,
                    boundedDays(
                      String(tenantPolicy.recordingRetentionDays),
                      policy.recordingDays,
                    ),
                  ),
                },
              }
            : {}),
        },
        data: {
          recordingUrl: null,
          recordingDeletedAt: now,
        },
      }),
      prisma.voiceCallLog.updateMany({
        where: {
          organizationId: tenantPolicy.organizationId,
          ...(tenantPolicy.transcriptionEnabled
            ? {
                createdAt: {
                  lt: cutoff(
                    now,
                    boundedDays(
                      String(tenantPolicy.transcriptRetentionDays),
                      policy.transcriptDays,
                    ),
                  ),
                },
              }
            : {}),
        },
        data: {
          transcript: null,
          messagesJson: null,
          rawEventJson: null,
          transcriptPlaceholder: null,
          transcriptStatus: "not_available",
          transcriptDeletedAt: now,
        },
      }),
    );

    if (
      !tenantPolicy.recordingEnabled ||
      !tenantPolicy.transcriptionEnabled
    ) {
      tenantOperations.push(
        prisma.voiceWebhookEvent.updateMany({
          where: {
            organizationId: tenantPolicy.organizationId,
            status: { in: ["processed", "ignored", "mapping_failed"] },
          },
          data: {
            rawPayloadJson: null,
            encryptedPayload: null,
          },
        }),
      );
    }
  }

  const tenantResults = tenantOperations.length
    ? await prisma.$transaction(tenantOperations)
    : [];
  let tenantVoiceRecordings = 0;
  let tenantTranscripts = 0;
  let tenantWebhookPayloads = 0;
  let resultIndex = 0;
  for (const tenantPolicy of tenantPolicies) {
    tenantVoiceRecordings += tenantResults[resultIndex++]?.count || 0;
    tenantTranscripts += tenantResults[resultIndex++]?.count || 0;
    if (
      !tenantPolicy.recordingEnabled ||
      !tenantPolicy.transcriptionEnabled
    ) {
      tenantWebhookPayloads += tenantResults[resultIndex++]?.count || 0;
    }
  }

  const [
    voiceRecordings,
    telecomRecordings,
    transcripts,
    webhookPayloads,
    whatsappMessages,
    whatsappPreviews,
    notificationPayloads,
  ] = await prisma.$transaction([
    prisma.voiceCallLog.updateMany({
      where: {
        organizationId: { notIn: configuredOrganizationIds },
        createdAt: { lt: recordingCutoff },
        recordingUrl: { not: null },
      },
      data: {
        recordingUrl: null,
        recordingDeletedAt: now,
      },
    }),
    prisma.callLog.updateMany({
      where: { createdAt: { lt: recordingCutoff }, recordingUrl: { not: null } },
      data: { recordingUrl: null },
    }),
    prisma.voiceCallLog.updateMany({
      where: {
        organizationId: { notIn: configuredOrganizationIds },
        createdAt: { lt: transcriptCutoff },
      },
      data: {
        transcript: null,
        messagesJson: null,
        rawEventJson: null,
        transcriptPlaceholder: null,
        transcriptStatus: "not_available",
        transcriptDeletedAt: now,
      },
    }),
    prisma.voiceWebhookEvent.updateMany({
      where: { createdAt: { lt: webhookCutoff } },
      data: {
        rawPayloadJson: null,
        encryptedPayload: null,
      },
    }),
    prisma.voiceWhatsappMessage.updateMany({
      where: { createdAt: { lt: messagingCutoff } },
      data: {
        body: null,
        rawPayloadJson: null,
      },
    }),
    prisma.voiceWhatsappConversation.updateMany({
      where: { lastMessageAt: { lt: messagingCutoff } },
      data: { lastMessagePreview: null },
    }),
    prisma.voiceNotificationLog.updateMany({
      where: { createdAt: { lt: messagingCutoff } },
      data: {
        payloadJson: null,
        recipient: "[REDACTED]",
      },
    }),
  ]);

  return {
    policy,
    redacted: {
      voiceRecordings: voiceRecordings.count + tenantVoiceRecordings,
      telecomRecordings: telecomRecordings.count,
      transcripts: transcripts.count + tenantTranscripts,
      webhookPayloads: webhookPayloads.count + tenantWebhookPayloads,
      whatsappMessages: whatsappMessages.count,
      whatsappPreviews: whatsappPreviews.count,
      notificationPayloads: notificationPayloads.count,
    },
  };
}
