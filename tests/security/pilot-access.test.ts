import assert from "node:assert/strict";
import test from "node:test";

import {
  getControlledPilotTenantIds,
  isPilotTenantAllowed,
} from "../../lib/security/pilot-access";

test("controlled pilot tenant parsing removes blanks and duplicates", () => {
  assert.deepEqual(
    [...getControlledPilotTenantIds("tenant-a, tenant-b,tenant-a,,")],
    ["tenant-a", "tenant-b"],
  );
});

test("controlled pilot mode fails closed for an empty allowlist", () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousPilot = process.env.WHATSQUERY_CONTROLLED_PILOT;
  const previousTenants = process.env.WHATSQUERY_PILOT_TENANT_IDS;
  mutableEnv.NODE_ENV = "production";
  process.env.WHATSQUERY_CONTROLLED_PILOT = "true";
  process.env.WHATSQUERY_PILOT_TENANT_IDS = "";

  try {
    assert.equal(isPilotTenantAllowed("tenant-a"), false);
    process.env.WHATSQUERY_PILOT_TENANT_IDS = "tenant-a";
    assert.equal(isPilotTenantAllowed("tenant-a"), true);
    assert.equal(isPilotTenantAllowed("tenant-b"), false);
  } finally {
    mutableEnv.NODE_ENV = previousNodeEnv;
    if (previousPilot === undefined) {
      delete process.env.WHATSQUERY_CONTROLLED_PILOT;
    } else {
      process.env.WHATSQUERY_CONTROLLED_PILOT = previousPilot;
    }
    if (previousTenants === undefined) {
      delete process.env.WHATSQUERY_PILOT_TENANT_IDS;
    } else {
      process.env.WHATSQUERY_PILOT_TENANT_IDS = previousTenants;
    }
  }
});
