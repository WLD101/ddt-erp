function isIpv4Private(hostname: string) {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isIpv6Private(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".localdomain") ||
    isIpv4Private(normalized) ||
    isIpv6Private(normalized)
  );
}

export function parseSafeExternalUrl(raw: string, options?: { allowHttp?: boolean; label?: string }) {
  const label = options?.label || "URL";
  let url: URL;

  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    throw new Error(`Invalid ${label}.`);
  }

  const allowedProtocols = options?.allowHttp ? ["http:", "https:"] : ["https:"];
  if (!allowedProtocols.includes(url.protocol)) {
    throw new Error(`${label} must use ${options?.allowHttp ? "http or https" : "https"}.`);
  }

  if (isPrivateHostname(url.hostname)) {
    throw new Error(`${label} must point to a public host.`);
  }

  return url;
}
