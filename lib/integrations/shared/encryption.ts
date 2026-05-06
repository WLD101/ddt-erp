import "server-only";

import crypto from "node:crypto";

import { IntegrationCredentials } from "./types";
import { getIntegrationEncryptionSecret } from "@/lib/security/env";

const CREDENTIALS_ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function getIntegrationSecret() {
  return getIntegrationEncryptionSecret();
}

function deriveKey() {
  return crypto.scryptSync(getIntegrationSecret(), "erp-sales-channel-credentials", KEY_LENGTH);
}

export function encryptIntegrationCredentials(credentials: IntegrationCredentials) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(CREDENTIALS_ALGORITHM, deriveKey(), iv);
  const payload = JSON.stringify(credentials);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptIntegrationCredentials(encryptedPayload: string | null | undefined) {
  if (!encryptedPayload) {
    return {} as IntegrationCredentials;
  }

  const [ivHex, authTagHex, encryptedHex] = encryptedPayload.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Stored integration credentials are malformed.");
  }

  const decipher = crypto.createDecipheriv(
    CREDENTIALS_ALGORITHM,
    deriveKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(decrypted) as IntegrationCredentials;
}

export function summarizeCredentialKeys(credentials: IntegrationCredentials) {
  return Object.keys(credentials).sort();
}
