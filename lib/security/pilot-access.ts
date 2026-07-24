import { isTruthyEnv } from "@/lib/security/env";

export function getControlledPilotTenantIds(
  value = process.env.WHATSQUERY_PILOT_TENANT_IDS,
) {
  return new Set(
    (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function isControlledPilotMode() {
  return (
    process.env.NODE_ENV === "production" &&
    isTruthyEnv(process.env.WHATSQUERY_CONTROLLED_PILOT)
  );
}

export function isPilotTenantAllowed(organizationId: string) {
  if (!isControlledPilotMode()) return true;
  return getControlledPilotTenantIds().has(organizationId);
}
