import test from "node:test";
import assert from "node:assert/strict";
import {
  getAuthenticatedRouteRedirect,
  getPostSignInRedirect,
  getUnauthenticatedRedirect,
  isSafeRelativePath,
  shouldResolveTenantContext,
  stripSensitiveSearchParams,
} from "../../lib/security/access";

test("super-admin is redirected to the platform after login", () => {
  process.env.SUPER_ADMIN_EMAILS = "admin@example.com,waleed@ddterp.com";

  assert.equal(
    getPostSignInRedirect({ email: "WALEED@ddterp.com", callbackUrl: "/", organizationId: null }),
    "/platform"
  );
});

test("tenant users cannot be routed into platform routes", () => {
  process.env.SUPER_ADMIN_EMAILS = "admin@example.com";

  assert.equal(
    getAuthenticatedRouteRedirect({
      pathname: "/platform/tenants",
      email: "tenant@example.com",
      organizationId: "org_1",
    }),
    "/"
  );
});

test("super-admins do not resolve tenant context", () => {
  process.env.SUPER_ADMIN_EMAILS = "admin@example.com";

  assert.equal(shouldResolveTenantContext("admin@example.com"), false);
  assert.equal(shouldResolveTenantContext("tenant@example.com"), true);
});

test("unauthenticated protected pages redirect to signin with a safe callback", () => {
  assert.equal(
    getUnauthenticatedRedirect("/sales", "?status=open"),
    "/auth/signin?callbackUrl=%2Fsales%3Fstatus%3Dopen"
  );
});

test("external callback URLs are rejected", () => {
  assert.equal(isSafeRelativePath("https://evil.example"), false);
  assert.equal(isSafeRelativePath("//evil.example"), false);
  assert.equal(
    getPostSignInRedirect({
      email: "tenant@example.com",
      callbackUrl: "https://evil.example",
      organizationId: "org_1",
    }),
    "/"
  );
});

test("sensitive credentials are stripped from query strings", () => {
  const stripped = stripSensitiveSearchParams("?email=user@example.com&password=secret&callbackUrl=%2Fplatform");
  assert.equal(stripped.changed, true);
  assert.equal(stripped.search, "?callbackUrl=%2Fplatform");

  assert.equal(
    getUnauthenticatedRedirect("/sales", "?email=user@example.com&password=secret&status=open"),
    "/auth/signin?callbackUrl=%2Fsales%3Fstatus%3Dopen"
  );
});
