// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Define paths
  const isAuthRoute = nextUrl.pathname.startsWith("/auth");
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isPublicRoute = 
    nextUrl.pathname === "/" || 
    nextUrl.pathname === "/pricing" || 
    nextUrl.pathname === "/contact" || 
    nextUrl.pathname === "/book-demo" ||
    nextUrl.pathname === "/partners";

  // 1. If it's an API route, don't redirect (let the API handle auth)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // 2. If it's an Auth route (/auth/signin, etc.)
  if (isAuthRoute) {
    if (isLoggedIn) {
      // If already logged in, go to dashboard
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    // Allow access to auth pages if not logged in
    return NextResponse.next();
  }

  // 3. If it's not an auth route and the user is NOT logged in
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // 4. If logged in but somehow missing organizationId (should be rare/impossible on fresh logic)
  // We could redirect to a /onboarding page if needed.
  // if (isLoggedIn && !req.auth?.user?.organizationId && nextUrl.pathname !== "/onboarding") {
  //   return NextResponse.redirect(new URL("/onboarding", nextUrl));
  // }

  return NextResponse.next();
});

// Optionally, don't run middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
