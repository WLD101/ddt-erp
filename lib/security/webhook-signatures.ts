import crypto from "node:crypto";

function constantTimeTextEquals(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export function verifySha256HmacSignature(params: {
  body: string;
  signature: string | null;
  secret: string | undefined;
  requiredPrefix?: string;
}) {
  if (!params.signature || !params.secret) {
    return false;
  }

  const prefix = params.requiredPrefix ?? "sha256=";
  if (!params.signature.startsWith(prefix)) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", params.secret)
    .update(params.body, "utf8")
    .digest("hex");

  return constantTimeTextEquals(params.signature.slice(prefix.length), expected);
}

