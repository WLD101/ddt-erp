const DEFAULT_TENANT_HOME = "/dashboard";
const PLATFORM_HOME = "/wq-command-center";
const LEGACY_PLATFORM_PREFIX = "/platform";
const DEV_PLATFORM_ADMINS = ["admin@whatsquery.local"];
const SENSITIVE_QUERY_KEYS = new Set([
  "email",
  "password",
  "pass",
  "token",
  "otp",
  "code",
  "secret",
  "resetToken",
]);

export function parseEmailAllowList(value = ""): string[] {
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined, allowList = "") {
  if (!email) return false;
  return parseEmailAllowList(allowList).includes(email.toLowerCase());
}

export function isPlatformAdminEmail(email: string | null | undefined, nodeEnv = process.env.NODE_ENV) {
  if (!email) return false;
  return isEmailAllowed(email, process.env.SUPER_ADMIN_EMAILS || "");
}

export function isSuperAdmin(email: string | null | undefined, nodeEnv = process.env.NODE_ENV) {
  return isPlatformAdminEmail(email, nodeEnv);
}

export function isSafeRelativePath(path: string | null | undefined) {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("\\") || path.includes("\n") || path.includes("\r")) return false;
  return true;
}

export function sanitizeRedirectPath(path: string | null | undefined, fallback = DEFAULT_TENANT_HOME) {
  return isSafeRelativePath(path) ? path! : fallback;
}

export function stripSensitiveSearchParams(search: string | URLSearchParams | null | undefined) {
  const params = search instanceof URLSearchParams
    ? new URLSearchParams(search)
    : new URLSearchParams(search?.startsWith("?") ? search.slice(1) : search || "");
  let changed = false;

  for (const key of Array.from(params.keys())) {
    if (SENSITIVE_QUERY_KEYS.has(key)) {
      params.delete(key);
      changed = true;
    }
  }

  const sanitized = params.toString();
  return {
    changed,
    search: sanitized ? `?${sanitized}` : "",
  };
}

export function getPostSignInRedirect(params: {
  email?: string | null;
  callbackUrl?: string | null;
  organizationId?: string | null;
}) {
  const fallback = params.organizationId ? DEFAULT_TENANT_HOME : "/";
  const callbackUrl = sanitizeRedirectPath(params.callbackUrl, fallback);
  if (isPlatformAdminEmail(params.email)) {
    if (callbackUrl === LEGACY_PLATFORM_PREFIX || callbackUrl.startsWith(`${LEGACY_PLATFORM_PREFIX}/`)) {
      return PLATFORM_HOME;
    }
    if (callbackUrl === PLATFORM_HOME || callbackUrl.startsWith(`${PLATFORM_HOME}/`)) {
      return PLATFORM_HOME;
    }
    if (callbackUrl === "/" || callbackUrl === DEFAULT_TENANT_HOME) {
      return PLATFORM_HOME;
    }
    return callbackUrl;
  }

  if (callbackUrl.startsWith(PLATFORM_HOME) || callbackUrl.startsWith(LEGACY_PLATFORM_PREFIX)) return DEFAULT_TENANT_HOME;

  if (!params.organizationId && callbackUrl === DEFAULT_TENANT_HOME) {
    return "/onboarding";
  }

  return callbackUrl;
}

export function shouldResolveTenantContext(email: string | null | undefined) {
  return !isPlatformAdminEmail(email);
}

export function getAuthenticatedRouteRedirect(params: {
  pathname: string;
  email?: string | null;
  organizationId?: string | null;
}) {
  const isPlatformAdmin = isPlatformAdminEmail(params.email);

  const isPlatformPath =
    params.pathname === PLATFORM_HOME ||
    params.pathname.startsWith(`${PLATFORM_HOME}/`) ||
    params.pathname === LEGACY_PLATFORM_PREFIX ||
    params.pathname.startsWith(`${LEGACY_PLATFORM_PREFIX}/`);

  if (isPlatformAdmin && params.pathname === LEGACY_PLATFORM_PREFIX) {
    return PLATFORM_HOME;
  }

  if (!isPlatformAdmin && isPlatformPath) {
    return DEFAULT_TENANT_HOME;
  }

  if (!isPlatformAdmin && !params.organizationId && params.pathname === DEFAULT_TENANT_HOME) {
    return "/onboarding";
  }

  return null;
}

export function getUnauthenticatedRedirect(pathname: string, search = "") {
  const sanitized = stripSensitiveSearchParams(search);
  const callbackUrl = `${pathname}${sanitized.search}`;
  return `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
