import { prisma } from "@/lib/prisma";

export type RecordingDisclosureStatus =
  | "disabled"
  | "not_required"
  | "pending"
  | "completed"
  | "declined";

export type VoicePrivacyPolicy = {
  organizationId: string;
  marketKey: string | null;
  country: string | null;
  industry: string | null;
  isClinical: boolean;
  recordingEnabled: boolean;
  recordingDisclosureEnabled: boolean;
  recordingDisclosureType: "verbal" | "stay-on-line";
  recordingDisclosureText: string | null;
  transcriptionEnabled: boolean;
  recordingRetentionDays: number;
  transcriptRetentionDays: number;
  allowRecordingPlayback: boolean;
  allowTranscriptAccess: boolean;
};

const RECORDING_KEYS = new Set([
  "recording",
  "recordingurl",
  "stereorecordingurl",
  "monorecordingurl",
  "videorecordingurl",
]);

const TRANSCRIPT_KEYS = new Set([
  "transcript",
  "originaltranscript",
  "messages",
  "messagesopenaiformatted",
  "conversation",
  "conversationupdate",
]);

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function normalizedKey(value: string) {
  return value.toLowerCase().replace(/[-_]/g, "");
}

function boundedRetentionDays(value: number | null | undefined, fallback: number) {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 3_650
    ? Number(value)
    : fallback;
}

function normalizeDisclosureType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "stay-on-line"
    ? ("stay-on-line" as const)
    : ("verbal" as const);
}

function isClinicalIndustry(industry: string | null | undefined) {
  const normalized = industry?.trim().toLowerCase() || "";
  return [
    "clinic",
    "clinical",
    "health",
    "healthcare",
    "hospital",
    "medical",
    "dental",
    "dentist",
    "pharmacy",
  ].some((term) => normalized.includes(term));
}

export function defaultVoicePrivacyPolicy(
  organizationId: string,
): VoicePrivacyPolicy {
  return {
    organizationId,
    marketKey: null,
    country: null,
    industry: null,
    isClinical: false,
    recordingEnabled: false,
    recordingDisclosureEnabled: true,
    recordingDisclosureType: "verbal",
    recordingDisclosureText: null,
    transcriptionEnabled: false,
    recordingRetentionDays: 30,
    transcriptRetentionDays: 30,
    allowRecordingPlayback: false,
    allowTranscriptAccess: false,
  };
}

export async function resolveVoicePrivacyPolicy(
  organizationId: string,
): Promise<VoicePrivacyPolicy> {
  const [organization, settings] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        marketKey: true,
        country: true,
        industry: true,
      },
    }),
    prisma.voiceReceptionistSettings.findUnique({
      where: { organizationId },
      select: {
        recordingEnabled: true,
        recordingDisclosureEnabled: true,
        recordingDisclosureType: true,
        recordingDisclosureText: true,
        transcriptionEnabled: true,
        recordingRetentionDays: true,
        transcriptRetentionDays: true,
        allowRecordingPlayback: true,
        allowTranscriptAccess: true,
      },
    }),
  ]);

  const fallback = defaultVoicePrivacyPolicy(organizationId);
  return {
    ...fallback,
    marketKey: organization?.marketKey || null,
    country: organization?.country || null,
    industry: organization?.industry || null,
    isClinical: isClinicalIndustry(organization?.industry),
    recordingEnabled: settings?.recordingEnabled ?? fallback.recordingEnabled,
    recordingDisclosureEnabled:
      settings?.recordingDisclosureEnabled ??
      fallback.recordingDisclosureEnabled,
    recordingDisclosureType: normalizeDisclosureType(
      settings?.recordingDisclosureType,
    ),
    recordingDisclosureText:
      settings?.recordingDisclosureText?.trim() || null,
    transcriptionEnabled:
      settings?.transcriptionEnabled ?? fallback.transcriptionEnabled,
    recordingRetentionDays: boundedRetentionDays(
      settings?.recordingRetentionDays,
      fallback.recordingRetentionDays,
    ),
    transcriptRetentionDays: boundedRetentionDays(
      settings?.transcriptRetentionDays,
      fallback.transcriptRetentionDays,
    ),
    allowRecordingPlayback:
      settings?.allowRecordingPlayback ?? fallback.allowRecordingPlayback,
    allowTranscriptAccess:
      settings?.allowTranscriptAccess ?? fallback.allowTranscriptAccess,
  };
}

function findRecordingConsent(value: unknown) {
  const source = asRecord(value);
  const message = asRecord(source.message);
  const call = asRecord(source.call);
  const candidates = [source, message, call];

  for (const candidate of candidates) {
    const consent = asRecord(asRecord(candidate.compliance).recordingConsent);
    if (Object.keys(consent).length > 0) return consent;
  }
  return null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveRecordingDisclosure(
  value: unknown,
  policy: VoicePrivacyPolicy,
): {
  status: RecordingDisclosureStatus;
  type: string | null;
  completedAt: Date | null;
  recordingAllowed: boolean;
} {
  if (!policy.recordingEnabled) {
    return {
      status: "disabled",
      type: policy.recordingDisclosureType,
      completedAt: null,
      recordingAllowed: false,
    };
  }

  if (!policy.recordingDisclosureEnabled) {
    return {
      status: "not_required",
      type: null,
      completedAt: null,
      recordingAllowed: true,
    };
  }

  const consent = findRecordingConsent(value);
  const completedAt = parseDate(consent?.grantedAt);
  if (completedAt) {
    return {
      status: "completed",
      type:
        typeof consent?.type === "string"
          ? consent.type
          : policy.recordingDisclosureType,
      completedAt,
      recordingAllowed: true,
    };
  }

  const source = asRecord(value);
  const eventType = String(source.type || asRecord(source.message).type || "")
    .trim()
    .toLowerCase();
  if (consent && eventType === "end-of-call-report") {
    return {
      status: "declined",
      type:
        typeof consent.type === "string"
          ? consent.type
          : policy.recordingDisclosureType,
      completedAt: null,
      recordingAllowed: false,
    };
  }

  return {
    status: "pending",
    type: policy.recordingDisclosureType,
    completedAt: null,
    recordingAllowed: false,
  };
}

function sanitizeArtifactValue(
  value: unknown,
  policy: VoicePrivacyPolicy,
  recordingAllowed: boolean,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeArtifactValue(item, policy, recordingAllowed),
    );
  }
  if (!value || typeof value !== "object") return value;

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, unknown>
  >((result, [key, childValue]) => {
    const keyName = normalizedKey(key);
    if (!recordingAllowed && RECORDING_KEYS.has(keyName)) return result;
    if (!policy.transcriptionEnabled && TRANSCRIPT_KEYS.has(keyName)) {
      return result;
    }
    result[key] = sanitizeArtifactValue(
      childValue,
      policy,
      recordingAllowed,
    );
    return result;
  }, {});
}

export function applyVoicePrivacyToVapiPayload(
  value: unknown,
  policy: VoicePrivacyPolicy,
  options: { recordingPreviouslyAuthorized?: boolean } = {},
) {
  const disclosure = resolveRecordingDisclosure(value, policy);
  const recordingAllowed =
    disclosure.recordingAllowed ||
    Boolean(options.recordingPreviouslyAuthorized && policy.recordingEnabled);
  return {
    payload: sanitizeArtifactValue(
      value,
      policy,
      recordingAllowed,
    ),
    disclosure: {
      ...disclosure,
      recordingAllowed,
    },
  };
}

export function serializeVoicePrivacyPolicy(policy: VoicePrivacyPolicy) {
  return JSON.stringify({
    marketKey: policy.marketKey,
    country: policy.country,
    industry: policy.industry,
    isClinical: policy.isClinical,
    recordingEnabled: policy.recordingEnabled,
    recordingDisclosureEnabled: policy.recordingDisclosureEnabled,
    recordingDisclosureType: policy.recordingDisclosureType,
    transcriptionEnabled: policy.transcriptionEnabled,
    recordingRetentionDays: policy.recordingRetentionDays,
    transcriptRetentionDays: policy.transcriptRetentionDays,
    allowRecordingPlayback: policy.allowRecordingPlayback,
    allowTranscriptAccess: policy.allowTranscriptAccess,
  });
}
