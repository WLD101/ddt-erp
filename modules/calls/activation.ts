import { prisma } from "@/lib/prisma";

import { TelecomError } from "./errors";
import { validateTelecomProviderEnv } from "./env";

export const TELECOM_ACTIVATION_MODES = [
  "DISABLED",
  "SANDBOX",
  "SIMULATION_ONLY",
  "LIMITED_PILOT",
  "PRODUCTION",
] as const;

export type TelecomActivationMode = (typeof TELECOM_ACTIVATION_MODES)[number];

type TelecomActivationGuardInput = {
  tenantId: string;
  providerId: string;
  destinationE164?: string | null;
};

type ActivationControlRecord = {
  id: string;
  scope: string;
  organizationId: string | null;
  providerId: string | null;
  mode: string;
  emergencyStopped: boolean;
  emergencyReason: string | null;
  tenantAllowlistJson: string | null;
  destinationAllowlistJson: string | null;
  expiresAt: Date | null;
};

const ACTIVATION_MODE_RANK: Record<TelecomActivationMode, number> = {
  DISABLED: 0,
  SIMULATION_ONLY: 1,
  SANDBOX: 2,
  LIMITED_PILOT: 3,
  PRODUCTION: 4,
};

export function normalizeActivationMode(mode: string | null | undefined): TelecomActivationMode {
  const normalized = (mode || "DISABLED").trim().toUpperCase();
  switch (normalized) {
    case "OFF":
      return "DISABLED";
    case "SIMULATION_ONLY":
      return "SIMULATION_ONLY";
    case "SANDBOX":
      return "SANDBOX";
    case "LIMITED_PILOT":
      return "LIMITED_PILOT";
    case "PRODUCTION":
      return "PRODUCTION";
    default:
      return "DISABLED";
  }
}

export function selectMostRestrictiveActivationMode(modes: Array<string | null | undefined>): TelecomActivationMode {
  return modes
    .map((mode) => normalizeActivationMode(mode))
    .sort((left, right) => ACTIVATION_MODE_RANK[left] - ACTIVATION_MODE_RANK[right])[0] || "DISABLED";
}

function parseStringArray(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function evaluateActivationControls(input: {
  controls: ActivationControlRecord[];
  tenantId: string;
  providerId: string;
  destinationE164?: string | null;
  now?: Date;
}) {
  const now = input.now || new Date();
  const applicable = input.controls.filter((control) => {
    if (control.providerId && control.providerId !== input.providerId) return false;
    if (control.organizationId && control.organizationId !== input.tenantId) return false;
    if (control.expiresAt && control.expiresAt.getTime() <= now.getTime()) return false;
    return true;
  });

  if (applicable.length === 0) {
    return {
      allowed: false,
      effectiveMode: "DISABLED" as TelecomActivationMode,
      denialReason: "Outbound calling is disabled because no activation control matched this request.",
    };
  }

  for (const control of applicable) {
    if (control.emergencyStopped) {
      return {
        allowed: false,
        effectiveMode: normalizeActivationMode(control.mode),
        denialReason: control.emergencyReason || "Outbound calling is emergency stopped.",
      };
    }
  }

  const effectiveMode = selectMostRestrictiveActivationMode(applicable.map((control) => control.mode));
  const tenantAllowlist = applicable.flatMap((control) => parseStringArray(control.tenantAllowlistJson));
  if (tenantAllowlist.length > 0 && !tenantAllowlist.includes(input.tenantId)) {
    return {
      allowed: false,
      effectiveMode,
      denialReason: "Tenant is not allowlisted for outbound calling.",
    };
  }

  const destinationAllowlist = applicable.flatMap((control) => parseStringArray(control.destinationAllowlistJson));
  if (
    destinationAllowlist.length > 0 &&
    input.destinationE164 &&
    !destinationAllowlist.some((prefix) => input.destinationE164!.startsWith(prefix))
  ) {
    return {
      allowed: false,
      effectiveMode,
      denialReason: "Destination is not allowlisted for outbound calling.",
    };
  }

  if (effectiveMode !== "PRODUCTION" && effectiveMode !== "LIMITED_PILOT") {
    return {
      allowed: false,
      effectiveMode,
      denialReason: `${effectiveMode} mode does not allow live provider calls.`,
    };
  }

  return {
    allowed: true,
    effectiveMode,
    denialReason: null,
  };
}

export async function assertTelecomActivationAllowed({
  providerId,
}: TelecomActivationGuardInput) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
    },
  });

  if (!provider) {
    throw new TelecomError("PROVIDER_UNAVAILABLE", "The requested telecom provider could not be found.", 404);
  }

  if (provider.status !== "ACTIVE") {
    throw new TelecomError("PROVIDER_UNAVAILABLE", `${provider.name} is not active for outbound voice traffic.`, 409);
  }

  validateTelecomProviderEnv();

  if (provider.type === "twilio" && process.env.VOICE_TWILIO_CALLING_ENABLED !== "true") {
    throw new TelecomError("CALLING_DISABLED", "Twilio outbound calling is disabled in this environment.", 503);
  }

  if (provider.type === "local_sip" && process.env.VOICE_ASTERISK_CALLING_ENABLED !== "true") {
    throw new TelecomError("CALLING_DISABLED", "Asterisk outbound calling is disabled in this environment.", 503);
  }
}
