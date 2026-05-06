import "server-only";

import crypto from "node:crypto";

import { DarazRequestParams, DarazSignedRequest } from "./types";

function normalizeParamValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

export function signDarazRequest(
  path: string,
  params: DarazRequestParams,
  appSecret: string
): DarazSignedRequest {
  const normalizedEntries = Object.entries({
    ...params,
    sign_method: "sha256",
  })
    .map(([key, value]) => [key, normalizeParamValue(value)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== null)
    .sort(([left], [right]) => left.localeCompare(right));

  const source = path + normalizedEntries.map(([key, value]) => `${key}${value}`).join("");
  const sign = crypto
    .createHmac("sha256", appSecret)
    .update(source, "utf8")
    .digest("hex")
    .toUpperCase();

  return {
    sign,
    params: Object.fromEntries(normalizedEntries),
  };
}
