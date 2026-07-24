const APP_URL_KEYS = [
  "APP_URL",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "VOICE_PUBLIC_APP_URL",
  "NEXT_PUBLIC_VOICE_URL",
] as const;

const PRODUCTION_APP_ORIGINS = [
  "https://whatsquery.com",
  "https://www.whatsquery.com",
  "https://voice.whatsquery.com",
] as const;

export class RequestOriginError extends Error {
  readonly statusCode = 403;

  constructor(message = "This request origin is not allowed.") {
    super(message);
    this.name = "RequestOriginError";
  }
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getTrustedAppOrigins(
  requestUrl?: string,
  nodeEnv = process.env.NODE_ENV,
) {
  const origins = new Set<string>();

  if (nodeEnv === "production") {
    for (const origin of PRODUCTION_APP_ORIGINS) {
      origins.add(origin);
    }
  }

  for (const key of APP_URL_KEYS) {
    const origin = normalizeOrigin(process.env[key]);
    if (origin) {
      origins.add(origin);
    }
  }

  if (nodeEnv !== "production") {
    const requestOrigin = normalizeOrigin(requestUrl);
    if (requestOrigin) {
      origins.add(requestOrigin);
    }
  }

  return origins;
}

export function isTrustedAppOrigin(
  candidate: string | null | undefined,
  requestUrl?: string,
  nodeEnv = process.env.NODE_ENV,
) {
  const origin = normalizeOrigin(candidate);
  if (!origin) return false;
  return getTrustedAppOrigins(requestUrl, nodeEnv).has(origin);
}

export function assertTrustedMutationRequest(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (isTrustedAppOrigin(origin, request.url)) {
    return;
  }

  if (isTrustedAppOrigin(referer, request.url)) {
    return;
  }

  throw new RequestOriginError("This request was blocked because it did not originate from WhatsQuery.");
}
