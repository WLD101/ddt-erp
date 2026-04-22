import crypto from "crypto";

const TOKEN_BYTES = 32;

export function createOpaqueToken() {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
