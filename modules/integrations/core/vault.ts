import crypto from "node:crypto";

import { getIntegrationEncryptionSecret } from "@/lib/security/env";

type IntegrationCredentialPayload = {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  clientSecret?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
};

type EncryptedCredentialEnvelope = {
  version: number;
  algorithm: "aes-256-gcm";
  iv: string;
  authTag: string;
  ciphertext: string;
};

export type { IntegrationCredentialPayload, EncryptedCredentialEnvelope };

function deriveKey(secret: string) {
  return crypto.createHash("sha256").update(secret).digest();
}

function parseEnvelope(value: string | EncryptedCredentialEnvelope): EncryptedCredentialEnvelope {
  if (typeof value === "string") {
    return JSON.parse(value) as EncryptedCredentialEnvelope;
  }
  return value;
}

export const integrationCredentialVault = {
  async encrypt(input: IntegrationCredentialPayload): Promise<EncryptedCredentialEnvelope> {
    const iv = crypto.randomBytes(12);
    const key = deriveKey(getIntegrationEncryptionSecret());
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const plaintext = JSON.stringify(input);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      version: 1,
      algorithm: "aes-256-gcm",
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    };
  },

  async decrypt(value: string | EncryptedCredentialEnvelope): Promise<IntegrationCredentialPayload> {
    const envelope = parseEnvelope(value);
    const key = deriveKey(getIntegrationEncryptionSecret());
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(envelope.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");

    return JSON.parse(plaintext) as IntegrationCredentialPayload;
  },

  async rotate(value: string | EncryptedCredentialEnvelope) {
    const payload = await this.decrypt(value);
    return this.encrypt(payload);
  },

  redact(value: unknown): unknown {
    if (!value || typeof value !== "object") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => this.redact(entry));
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        if (/(token|secret|password|key|authorization|cookie)/i.test(key)) {
          return [key, "[REDACTED]"];
        }
        if (entry && typeof entry === "object") {
          return [key, this.redact(entry)];
        }
        return [key, entry];
      })
    );
  },
};
