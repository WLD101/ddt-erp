import crypto from "node:crypto";

const ENCRYPTION_VERSION = "v1";
const SENSITIVE_VALUE_KEYS = new Set([
  "authorization",
  "secret",
  "token",
  "apikey",
  "api_key",
  "recordingurl",
  "stereorecordingurl",
  "monorecordingurl",
  "summary",
  "messagesopenaiformatted",
]);
const TRANSCRIPT_KEYS = new Set(["transcript", "originaltranscript"]);
const PHONE_KEYS = new Set([
  "number",
  "phonenumber",
  "caller",
  "callernumber",
  "customernumber",
  "from",
  "to",
]);
const EMAIL_KEYS = new Set(["email", "customeremail"]);
const TOOL_ARGUMENT_KEYS = new Set(["arguments", "parameters"]);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
      return result;
    }, {});
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return "[REDACTED_PHONE]";
  return `[REDACTED_PHONE:${digits.slice(-4)}]`;
}

function maskEmail(value: string) {
  const [local, domain] = value.split("@");
  if (!local || !domain) return "[REDACTED_EMAIL]";
  return `${local.slice(0, 1)}***@${domain}`;
}

function redactValue(value: unknown, key = ""): unknown {
  const normalizedKey = key.toLowerCase().replace(/[-_]/g, "");

  if (SENSITIVE_VALUE_KEYS.has(normalizedKey)) {
    return value === null || value === undefined ? value : "[REDACTED]";
  }
  if (TRANSCRIPT_KEYS.has(normalizedKey)) {
    return typeof value === "string" && value.length > 0 ? "[REDACTED_TRANSCRIPT]" : value;
  }
  if (PHONE_KEYS.has(normalizedKey) && typeof value === "string") {
    return maskPhone(value);
  }
  if (EMAIL_KEYS.has(normalizedKey) && typeof value === "string") {
    return maskEmail(value);
  }
  if (TOOL_ARGUMENT_KEYS.has(normalizedKey)) {
    return value === null || value === undefined ? value : "[ENCRYPTED_TOOL_ARGUMENTS]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (result, [childKey, childValue]) => {
        result[childKey] = redactValue(childValue, childKey);
        return result;
      },
      {},
    );
  }
  return value;
}

function getEncryptionSecret() {
  return process.env.VAPI_EVENT_ENCRYPTION_KEY || process.env.VAPI_WEBHOOK_SECRET || null;
}

function deriveKey(secret: string) {
  return crypto.createHash("sha256").update(`whatsquery:vapi-events:${secret}`).digest();
}

export function stableJson(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

export function hashVapiPayload(value: unknown) {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

export function redactVapiPayload(value: unknown) {
  return redactValue(value);
}

export function encryptVapiPayload(value: unknown) {
  const secret = getEncryptionSecret();
  if (!secret) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptVapiPayload(encryptedPayload: string | null | undefined) {
  if (!encryptedPayload) return null;
  const secret = getEncryptionSecret();
  if (!secret) throw new Error("VAPI_EVENT_ENCRYPTION_KEY is unavailable.");

  const [version, iv, authTag, ciphertext] = encryptedPayload.split(".");
  if (version !== ENCRYPTION_VERSION || !iv || !authTag || !ciphertext) {
    throw new Error("Encrypted Vapi event payload is malformed.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    deriveKey(secret),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(decrypted) as Record<string, unknown>;
}

export function buildVapiDeduplicationKey({
  providerEventId,
  providerCallId,
  eventType,
  payloadHash,
}: {
  providerEventId?: string | null;
  providerCallId?: string | null;
  eventType: string;
  payloadHash: string;
}) {
  if (providerEventId) return `vapi:event:${providerEventId}`;
  if (eventType === "assistant-request" && providerCallId) {
    return `vapi:${providerCallId}:assistant-request`;
  }
  return `vapi:${providerCallId || "unassigned"}:${eventType}:${payloadHash}`;
}
