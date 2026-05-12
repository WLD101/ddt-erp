import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getUnauthenticatedRedirect,
  stripSensitiveSearchParams,
  isSuperAdmin,
} from "@/lib/security/access";

export default async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  const isLoggedIn = !!token;
  const userEmail = typeof token?.email === "string" ? token.email : undefined;
  const organizationId =
    typeof token?.organizationId === "string" ? token.organizationId : undefined;

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
    pathname === "/book-demo" ||
    pathname === "/pricing" ||
    pathname === "/contact" ||
    pathname === "/about" ||
    pathname === "/features" ||
    pathname === "/partners" ||
    pathname.startsWith("/auth/verify") ||
    pathname.startsWith("/industries");

  if (isApiRoute) {
    return NextResponse.next();
  }

  if (pathname === "/platform") {
    return NextResponse.redirect(new URL("/wq-command-center", nextUrl));
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
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

  if (!isLoggedIn && !isPublicRoute && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(
      new URL(getUnauthenticatedRedirect(pathname, nextUrl.search), nextUrl)
    );
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
