const APP_URL_KEYS = ["APP_URL", "NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"] as const;

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

export function getTrustedAppOrigins(requestUrl?: string) {
  const origins = new Set<string>();

  for (const key of APP_URL_KEYS) {
    const origin = normalizeOrigin(process.env[key]);
    if (origin) {
      origins.add(origin);
    }
  }

  const requestOrigin = normalizeOrigin(requestUrl);
  if (requestOrigin) {
    origins.add(requestOrigin);
  }

  return origins;
}

export function isTrustedAppOrigin(candidate: string | null | undefined, requestUrl?: string) {
  const origin = normalizeOrigin(candidate);
  if (!origin) return false;
  return getTrustedAppOrigins(requestUrl).has(origin);
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
