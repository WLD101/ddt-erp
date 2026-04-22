import test from "node:test";
import assert from "node:assert/strict";
import { AuthorizationError } from "../../lib/security/errors";
import { assertBranchAccess, assertOrganizationAccess } from "../../lib/security/scope";

test("tenant user cannot access another tenant's records", () => {
  assert.throws(
    () => assertOrganizationAccess("org_other", "org_current"),
    (error) => error instanceof AuthorizationError && error.statusCode === 404
  );
});

test("tenant user can access own tenant records", () => {
  assert.doesNotThrow(() => assertOrganizationAccess("org_current", "org_current"));
});

test("staff cannot access another branch", () => {
  assert.throws(
    () => assertBranchAccess({ recordBranchId: "branch_other", activeBranchId: "branch_current", role: "staff" }),
    (error) => error instanceof AuthorizationError && error.statusCode === 403
  );
});

test("owner/admin branch access is explicitly privileged", () => {
  assert.doesNotThrow(() =>
    assertBranchAccess({ recordBranchId: "branch_other", activeBranchId: "branch_current", role: "owner" })
  );
});
