import process from "node:process";

const requiredGroups = [
  ["DATABASE_URL"],
  ["DIRECT_URL"],
  ["AUTH_SECRET", "NEXTAUTH_SECRET"],
  ["NEXTAUTH_URL"],
  ["ENCRYPTION_KEY", "INTEGRATION_CREDENTIAL_SECRET"],
  ["INTEGRATION_WEBHOOK_SIGNING_KEY"],
  ["REDIS_URL"],
  ["VAPI_PRIVATE_API_KEY"],
  ["VAPI_WEBHOOK_SECRET"],
  ["VAPI_EVENT_ENCRYPTION_KEY"],
  ["VAPI_SERVER_CREDENTIAL_ID"],
  ["VOICE_JOBS_SECRET"],
];
const disabledPilotFlags = [
  "INTEGRATION_INTERNAL_TEST_PROVIDER",
  "INTEGRATION_VOICE_TOOLS",
  "INTEGRATION_SYNC_ENGINE",
  "INTEGRATION_APPROVALS",
  "INTEGRATION_OUTBOUND_WEBHOOKS",
  "INTEGRATION_GOOGLE_WORKSPACE",
  "INTEGRATION_HUBSPOT",
  "INTEGRATION_CUSTOMER_WEBHOOKS",
  "INTEGRATION_UNIVERSAL_REST",
  "VOICE_ERP_WRITE_ENABLED",
  "VOICE_WHATSAPP_SEND_ENABLED",
  "VOICE_TWILIO_CALLING_ENABLED",
  "VOICE_ASTERISK_CALLING_ENABLED",
];
const failures = [];

function configured(key) {
  const value = process.env[key]?.trim();
  return Boolean(
    value &&
      !/replace|placeholder|change-me|your[-_]|example/i.test(value),
  );
}

function enabled(key) {
  return /^(1|true|yes|on)$/i.test(process.env[key]?.trim() || "");
}

for (const group of requiredGroups) {
  if (!group.some(configured)) {
    failures.push(`Missing required configuration: ${group.join(" or ")}`);
  }
}

for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  if (!configured(key)) continue;
  try {
    const url = new URL(process.env[key]);
    if (
      /(^|\.)supabase\.(com|co)$/i.test(url.hostname) ||
      /pooler\.supabase\.com$/i.test(url.hostname)
    ) {
      failures.push(`${key} still points to Supabase Cloud.`);
    }
  } catch {
    failures.push(`${key} is malformed.`);
  }
}

if (process.env.NODE_ENV !== "production") {
  failures.push("NODE_ENV must be production.");
}
if (!process.env.NEXTAUTH_URL?.startsWith("https://")) {
  failures.push("NEXTAUTH_URL must use HTTPS.");
}
if (!enabled("WHATSQUERY_CONTROLLED_PILOT")) {
  failures.push("WHATSQUERY_CONTROLLED_PILOT must be enabled.");
}
if (
  !(process.env.WHATSQUERY_PILOT_TENANT_IDS || "")
    .split(",")
    .some((value) => value.trim())
) {
  failures.push("WHATSQUERY_PILOT_TENANT_IDS must contain an approved tenant.");
}
for (const key of disabledPilotFlags) {
  if (enabled(key)) failures.push(`${key} must remain disabled for the pilot.`);
}
if (
  enabled("VOICE_CALLING_ENABLED") &&
  !enabled("WHATSQUERY_PILOT_LIVE_CALLS_APPROVED")
) {
  failures.push(
    "VOICE_CALLING_ENABLED requires WHATSQUERY_PILOT_LIVE_CALLS_APPROVED after live Vapi verification.",
  );
}

console.log(
  JSON.stringify(
    {
      productionEnvironment: process.env.NODE_ENV === "production",
      controlledPilot: enabled("WHATSQUERY_CONTROLLED_PILOT"),
      approvedTenantCount: (process.env.WHATSQUERY_PILOT_TENANT_IDS || "")
        .split(",")
        .filter((value) => value.trim()).length,
      liveCallingEnabled: enabled("VOICE_CALLING_ENABLED"),
      unfinishedProviderFlagsDisabled: disabledPilotFlags.every(
        (key) => !enabled(key),
      ),
      requiredConfigurationGroups: requiredGroups.length,
      failures,
    },
    null,
    2,
  ),
);

if (failures.length > 0) process.exitCode = 1;
