import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateActivationControls,
  normalizeActivationMode,
  selectMostRestrictiveActivationMode,
} from "@/modules/calls/activation";
import { TelecomError } from "@/modules/calls/errors";
import { requireSingleWebhookMatch, selectUniqueWebhookMatch } from "@/modules/calls/webhook-mapping";

test("activation defaults to disabled when no matching controls exist", () => {
  const result = evaluateActivationControls({
    controls: [],
    tenantId: "org_1",
    providerId: "prov_1",
    destinationE164: "+14155552671",
  });

  assert.equal(result.allowed, false);
  assert.equal(result.effectiveMode, "DISABLED");
  assert.match(result.denialReason || "", /disabled/i);
});

test("activation uses the most restrictive matching mode", () => {
  const result = evaluateActivationControls({
    controls: [
      {
        id: "global",
        scope: "global",
        organizationId: null,
        providerId: null,
        mode: "PRODUCTION",
        emergencyStopped: false,
        emergencyReason: null,
        tenantAllowlistJson: null,
        destinationAllowlistJson: null,
        expiresAt: null,
      },
      {
        id: "tenant",
        scope: "tenant",
        organizationId: "org_1",
        providerId: null,
        mode: "SIMULATION_ONLY",
        emergencyStopped: false,
        emergencyReason: null,
        tenantAllowlistJson: JSON.stringify(["org_1"]),
        destinationAllowlistJson: null,
        expiresAt: null,
      },
    ],
    tenantId: "org_1",
    providerId: "prov_1",
    destinationE164: "+14155552671",
  });

  assert.equal(result.allowed, false);
  assert.equal(result.effectiveMode, "SIMULATION_ONLY");
  assert.match(result.denialReason || "", /does not allow live provider calls/i);
});

test("activation enforces emergency stop and destination allowlists", () => {
  const deniedByEmergency = evaluateActivationControls({
    controls: [
      {
        id: "global",
        scope: "global",
        organizationId: null,
        providerId: null,
        mode: "PRODUCTION",
        emergencyStopped: true,
        emergencyReason: "Carrier maintenance",
        tenantAllowlistJson: null,
        destinationAllowlistJson: null,
        expiresAt: null,
      },
    ],
    tenantId: "org_1",
    providerId: "prov_1",
    destinationE164: "+923001234567",
  });
  assert.equal(deniedByEmergency.allowed, false);
  assert.match(deniedByEmergency.denialReason || "", /Carrier maintenance/);

  const deniedByDestination = evaluateActivationControls({
    controls: [
      {
        id: "tenant",
        scope: "tenant",
        organizationId: "org_1",
        providerId: null,
        mode: "LIMITED_PILOT",
        emergencyStopped: false,
        emergencyReason: null,
        tenantAllowlistJson: JSON.stringify(["org_1"]),
        destinationAllowlistJson: JSON.stringify(["+92"]),
        expiresAt: null,
      },
    ],
    tenantId: "org_1",
    providerId: "prov_1",
    destinationE164: "+14155552671",
  });
  assert.equal(deniedByDestination.allowed, false);
  assert.match(deniedByDestination.denialReason || "", /not allowlisted/i);
});

test("activation helpers normalize legacy mode names", () => {
  assert.equal(normalizeActivationMode("OFF"), "DISABLED");
  assert.equal(selectMostRestrictiveActivationMode(["PRODUCTION", "SANDBOX", "LIMITED_PILOT"]), "SANDBOX");
});

test("ambiguous webhook matches fail closed", () => {
  const ambiguous = selectUniqueWebhookMatch([{ id: "a" }, { id: "b" }]);
  assert.equal(ambiguous.type, "ambiguous");

  assert.throws(
    () => requireSingleWebhookMatch([{ id: "a" }, { id: "b" }], "provider"),
    (error) =>
      error instanceof TelecomError &&
      error.code === "AMBIGUOUS_WEBHOOK_MAPPING" &&
      /Refusing unsafe fallback/i.test(error.message)
  );
});
