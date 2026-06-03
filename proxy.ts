import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getUnauthenticatedRedirect,
  stripSensitiveSearchParams,
  isSuperAdmin,
} from "@/lib/security/access";
import { isVoiceHost, toVoiceInternalPath } from "@/lib/voice/routing";

export default async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const voiceHost = isVoiceHost(host);
  const isPublicVoiceExternalRoute =
    voiceHost &&
    (pathname === "/" ||
      pathname === "/login" ||
      pathname === "/status");
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  const isLoggedIn = !!token;
  const userEmail = typeof token?.email === "string" ? token.email : undefined;
  const organizationId =
    typeof token?.organizationId === "string" ? token.organizationId : undefined;
  const forceSignOut = token?.forceSignOut === true;

  const preserveSensitiveAuthParams =
    pathname.startsWith("/auth/verify-otp") ||
    pathname.startsWith("/auth/reset-password") ||
    pathname.startsWith("/auth/join");

  const sanitizedSearch = preserveSensitiveAuthParams
    ? { changed: false, search: nextUrl.search }
    : stripSensitiveSearchParams(nextUrl.searchParams);

  if (sanitizedSearch.changed) {
    const cleanUrl = nextUrl.clone();
    cleanUrl.search = sanitizedSearch.search;
    return NextResponse.redirect(cleanUrl);
  }

  const isAuthRoute = pathname.startsWith("/auth");
  const isApiRoute = pathname.startsWith("/api") || pathname.startsWith("/_next");

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/voice" ||
    pathname === "/status" ||
    pathname === "/login" ||
    pathname === "/book-demo" ||
    pathname === "/pricing" ||
    pathname === "/contact" ||
    pathname === "/about" ||
    pathname === "/features" ||
    pathname === "/partners" ||
    pathname === "/voice/login" ||
    pathname === "/voice/status" ||
    pathname.startsWith("/auth/verify") ||
    pathname.startsWith("/industries") ||
    isPublicVoiceExternalRoute;

  if (
    voiceHost &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/_next") &&
    pathname !== "/favicon.ico" &&
    !pathname.includes(".")
  ) {
    const rewritePath = toVoiceInternalPath(pathname);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", rewritePath);
    requestHeaders.set("x-whatsquery-surface", "voice");

    const rewriteUrl = new URL(rewritePath, req.url);
    // Force http for internal rewrite to prevent Next.js from trying to fetch https://localhost:3000
    if (rewriteUrl.hostname === 'localhost' || rewriteUrl.hostname === '127.0.0.1' || req.headers.get("x-forwarded-proto") === "https") {
      rewriteUrl.protocol = 'http:';
      rewriteUrl.hostname = '127.0.0.1';
      rewriteUrl.port = '3000';
    }

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (isApiRoute) {
    return NextResponse.next();
  }

  if (pathname === "/platform") {
    return NextResponse.redirect(new URL("/wq-command-center", nextUrl));
  }

  if (pathname === "/" && isLoggedIn && isSuperAdmin(userEmail)) {
    return NextResponse.redirect(new URL("/wq-command-center", nextUrl));
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (forceSignOut && pathname !== "/auth/force-signout") {
        return NextResponse.redirect(new URL("/auth/force-signout", nextUrl));
      }
      if (isSuperAdmin(userEmail)) {
        return NextResponse.redirect(new URL("/wq-command-center", nextUrl));
      }
      if (!organizationId) {
        return NextResponse.redirect(new URL("/onboarding/packages", nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(
      new URL(getUnauthenticatedRedirect(pathname, nextUrl.search), nextUrl)
    );
  }

  if (forceSignOut && pathname !== "/auth/force-signout") {
    return NextResponse.redirect(new URL("/auth/force-signout", nextUrl));
  }

  if (isLoggedIn && !isSuperAdmin(userEmail) && !organizationId && !pathname.startsWith("/onboarding") && !isPublicRoute) {
    return NextResponse.redirect(new URL("/onboarding/packages", nextUrl));
  }

  if (pathname === "/dashboard" && isSuperAdmin(userEmail)) {
    return NextResponse.redirect(new URL("/wq-command-center", nextUrl));
  }

  if (pathname.startsWith("/wq-command-center")) {
    if (!isLoggedIn || !isSuperAdmin(userEmail)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
