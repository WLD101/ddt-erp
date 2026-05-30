import { headers } from "next/headers";

export const VOICE_INTERNAL_PREFIX = "/voice";
export const VOICE_HOSTS = [
  "voice.whatsquery.com",
  "voice.localhost",
];

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function isVoiceHost(host?: string | null) {
  if (!host) return false;
  const normalizedHost = host.split(":")[0].toLowerCase();
  return VOICE_HOSTS.includes(normalizedHost) || normalizedHost.startsWith("voice.");
}

export function toVoiceInternalPath(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  if (normalizedPath === VOICE_INTERNAL_PREFIX || normalizedPath.startsWith(`${VOICE_INTERNAL_PREFIX}/`)) {
    return normalizedPath;
  }
  return normalizedPath === "/" ? VOICE_INTERNAL_PREFIX : `${VOICE_INTERNAL_PREFIX}${normalizedPath}`;
}

export function toVoiceExternalPath(pathname: string, host?: string | null) {
  const normalizedPath = normalizePath(pathname);
  const internalPath = toVoiceInternalPath(normalizedPath);

  if (isVoiceHost(host)) {
    const stripped = internalPath.slice(VOICE_INTERNAL_PREFIX.length) || "/";
    return stripped.startsWith("/") ? stripped : `/${stripped}`;
  }

  return internalPath;
}

export async function getVoiceRequestHost() {
  const requestHeaders = await headers();
  return requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
}
