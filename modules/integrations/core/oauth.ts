import crypto from "node:crypto";

import { getAuthSecret } from "@/lib/security/env";
import { integrationCredentialVault } from "./vault";

export type OAuthStateRecord = {
  stateId: string;
  tenantId: string;
  userId: string;
  providerKey: string;
  redirectPath: string;
  codeVerifierEncrypted: string;
  expiresAt: Date;
  consumedAt?: Date | null;
  signature: string;
};

export type OAuthStateStore = {
  save(record: OAuthStateRecord): Promise<void>;
  findByStateId(stateId: string): Promise<OAuthStateRecord | null>;
  consume(stateId: string, consumedAt: Date): Promise<boolean>;
};

function getOAuthSecret() {
  return getAuthSecret() || "dev-only-oauth-secret";
}

function toBase64Url(value: Buffer) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signStatePayload(payload: string) {
  return toBase64Url(crypto.createHmac("sha256", getOAuthSecret()).update(payload).digest());
}

function constantTimeTextEquals(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function assertSafeRedirectPath(path: string) {
  if (!path.startsWith("/")) {
    throw new Error("OAuth redirect path must be relative to this application.");
  }
  if (path.startsWith("//") || path.includes("\\") || path.includes("..")) {
    throw new Error("Unsafe OAuth redirect path.");
  }
}

export async function createOAuthState(
  store: OAuthStateStore,
  input: {
    tenantId: string;
    userId: string;
    providerKey: string;
    redirectPath: string;
    ttlMinutes?: number;
  }
) {
  assertSafeRedirectPath(input.redirectPath);
  const stateId = crypto.randomUUID();
  const codeVerifier = toBase64Url(crypto.randomBytes(32));
  const challenge = toBase64Url(crypto.createHash("sha256").update(codeVerifier).digest());
  const expiresAt = new Date(Date.now() + (input.ttlMinutes ?? 10) * 60_000);
  const signature = signStatePayload(
    JSON.stringify({
      stateId,
      tenantId: input.tenantId,
      userId: input.userId,
      providerKey: input.providerKey,
      redirectPath: input.redirectPath,
      expiresAt: expiresAt.toISOString(),
    })
  );
  const envelope = await integrationCredentialVault.encrypt({ apiKey: codeVerifier });
  const record: OAuthStateRecord = {
    stateId,
    tenantId: input.tenantId,
    userId: input.userId,
    providerKey: input.providerKey,
    redirectPath: input.redirectPath,
    codeVerifierEncrypted: JSON.stringify(envelope),
    expiresAt,
    signature,
  };

  await store.save(record);

  return {
    state: `${stateId}.${signature}`,
    codeVerifier,
    codeChallenge: challenge,
    expiresAt,
  };
}

export async function validateOAuthState(
  store: OAuthStateStore,
  input: {
    state: string;
    providerKey: string;
    tenantId: string;
    userId: string;
  }
) {
  const [stateId, signature] = input.state.split(".");
  if (!stateId || !signature) {
    throw new Error("Invalid OAuth state.");
  }

  const record = await store.findByStateId(stateId);
  if (!record) {
    throw new Error("OAuth state not found.");
  }
  if (record.providerKey !== input.providerKey) {
    throw new Error("OAuth state provider mismatch.");
  }
  if (record.tenantId !== input.tenantId) {
    throw new Error("OAuth state tenant mismatch.");
  }
  if (record.userId !== input.userId) {
    throw new Error("OAuth state user mismatch.");
  }
  if (record.consumedAt) {
    throw new Error("OAuth state already used.");
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    throw new Error("OAuth state expired.");
  }
  if (!constantTimeTextEquals(signature, record.signature)) {
    throw new Error("OAuth state signature mismatch.");
  }

  const expectedSignature = signStatePayload(
    JSON.stringify({
      stateId: record.stateId,
      tenantId: record.tenantId,
      userId: record.userId,
      providerKey: record.providerKey,
      redirectPath: record.redirectPath,
      expiresAt: record.expiresAt.toISOString(),
    })
  );

  if (!constantTimeTextEquals(signature, expectedSignature)) {
    throw new Error("OAuth state signature invalid.");
  }

  const decrypted = await integrationCredentialVault.decrypt(record.codeVerifierEncrypted);
  if (!decrypted.apiKey) {
    throw new Error("OAuth verifier missing.");
  }

  const consumed = await store.consume(stateId, new Date());
  if (!consumed) {
    throw new Error("OAuth state already used.");
  }

  return {
    record,
    codeVerifier: decrypted.apiKey,
  };
}
