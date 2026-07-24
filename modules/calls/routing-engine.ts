import { prisma } from "@/lib/prisma";
import { TelecomError } from "./errors";
import { isProviderHealthAcceptable } from "./provider-health";
import { detectCallingCountry, isBlockedDestination, normalizePhoneNumber, normalizeToE164, PhoneNumberError } from "./phone";
import { maskPhoneNumber } from "./masking";

export type RoutingDecisionStep = {
  order: number;
  code: string;
  result: "PASS" | "FAIL" | "SKIP" | "SELECT";
  message: string;
  providerId?: string;
  routingRuleId?: string;
};

export type RoutingDecision = {
  normalizedDestination: string;
  countryCode: string;
  dialCode: string;
  allowed: boolean;
  selectedProvider: ProviderCandidate | null;
  selectedCallerNumber: { id: string; number: string; maskedNumber: string | null } | null;
  matchedRuleId: string | null;
  fallbackProviders: ProviderCandidate[];
  decisionTrace: RoutingDecisionStep[];
  rejectionCode?: string;
  rejectionMessage?: string;
};

export type ProviderCandidate = {
  id: string;
  name: string;
  type: string;
  countryCode: string | null;
  status: string;
  healthStatus: string | null;
  priority: number;
  routingRuleId?: string;
};

type EvaluateRoutingInput = {
  tenantId: string;
  destination: string;
  selectedCountry?: string | null;
  callerNumberId?: string | null;
  from?: string | null;
  simulateAt?: Date | null;
  requireCallerId?: boolean;
  skipRateLimit?: boolean;
};

export async function evaluateRoutingDecision(input: EvaluateRoutingInput): Promise<RoutingDecision> {
  const trace = createTrace();
  const now = input.simulateAt || new Date();

  const tenant = await prisma.organization.findUnique({
    where: { id: input.tenantId },
    select: { id: true, name: true, accessStatus: true, lifecycleStatus: true },
  });
  if (!tenant) {
    return rejected("TENANT_ACTIVE", "TENANT_NOT_FOUND", "Tenant does not exist.", trace);
  }
  trace.add("TENANT_ACTIVE", "PASS", `Tenant ${tenant.name} exists.`);

  let destination;
  try {
    destination = normalizePhoneNumber(input.destination, input.selectedCountry);
  } catch (error) {
    if (error instanceof PhoneNumberError) {
      return rejected("DESTINATION_VALID", error.code, error.message, trace);
    }
    throw error;
  }
  const detection = detectCallingCountry(destination.e164, input.selectedCountry);
  trace.add("DESTINATION_VALID", "PASS", `Destination normalized as ${maskPhoneNumber(destination.e164)}.`);

  if (isBlockedDestination(destination.e164)) {
    return rejected("DESTINATION_ALLOWED", "DESTINATION_BLOCKED", "Destination is blocked by policy.", trace);
  }
  trace.add("DESTINATION_ALLOWED", "PASS", "Destination is not blocked.");

  const callerNumber = await resolveAuthorizedCallerNumber({
    tenantId: input.tenantId,
    callerNumberId: input.callerNumberId,
    from: input.from,
    destinationCountry: detection.isoCode,
    defaultCountry: input.selectedCountry,
    required: input.requireCallerId !== false,
  });
  if (callerNumber) {
    trace.add("CALLER_ID_AUTHORIZED", "PASS", `Caller ID ${maskPhoneNumber(callerNumber.number)} is authorized.`);
  } else {
    trace.add("CALLER_ID_AUTHORIZED", "SKIP", "Caller ID was not required for this simulation.");
  }

  const rules = await prisma.countryRoutingRule.findMany({
    where: {
      isActive: true,
      OR: [
        { tenantId: input.tenantId },
        { tenantId: null },
      ],
      AND: [
        { OR: [{ isoCode: detection.isoCode }, { dialCode: detection.dialCode }] },
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
      ],
    },
    include: {
      provider: true,
      fallbackProvider: true,
    },
    orderBy: [{ tenantId: "desc" }, { priority: "asc" }, { weight: "desc" }, { createdAt: "asc" }],
  });

  const matchingRules = rules.filter((rule) => !rule.prefix || destination.e164.startsWith(rule.prefix));
  if (matchingRules.length === 0) {
    return rejected("COUNTRY_RULE_MATCHED", "NO_ROUTE_AVAILABLE", `No active route is configured for ${detection.isoCode}.`, trace);
  }
  trace.add("COUNTRY_RULE_MATCHED", "PASS", `${matchingRules.length} routing rule(s) matched.`);

  const fallbackProviders: ProviderCandidate[] = [];

  for (const rule of matchingRules) {
    const primary = toCandidate(rule.provider, rule.id, rule.priority);
    if (!isProviderEnabled(primary.status)) {
      trace.add("PROVIDER_ENABLED", "FAIL", `${rule.provider.name} is not enabled.`, rule.providerId, rule.id);
      continue;
    }
    trace.add("PROVIDER_ENABLED", "PASS", `${rule.provider.name} is enabled.`, rule.providerId, rule.id);

    if (rule.requireHealthyProvider && !isProviderHealthAcceptable(rule.provider.healthStatus, rule.emergencyOverride)) {
      trace.add("PROVIDER_HEALTH_ACCEPTABLE", "FAIL", `${rule.provider.name} health is ${rule.provider.healthStatus}.`, rule.providerId, rule.id);
      if (rule.fallbackProvider && rule.fallbackEligible) {
        fallbackProviders.push(toCandidate(rule.fallbackProvider, rule.id, rule.priority + 1));
        trace.add("FALLBACK_PROVIDER_ADDED", "PASS", `${rule.fallbackProvider.name} added as fallback.`, rule.fallbackProvider.id, rule.id);
      }
      continue;
    }
    trace.add("PROVIDER_HEALTH_ACCEPTABLE", "PASS", `${rule.provider.name} health is acceptable.`, rule.providerId, rule.id);

    if (rule.maxConcurrentCalls !== null && rule.provider.concurrentActiveCalls >= rule.maxConcurrentCalls) {
      trace.add("PROVIDER_CAPACITY_AVAILABLE", "FAIL", `${rule.provider.name} is at active-call capacity.`, rule.providerId, rule.id);
      continue;
    }
    trace.add("PROVIDER_CAPACITY_AVAILABLE", "PASS", `${rule.provider.name} has capacity.`, rule.providerId, rule.id);

    if (rule.fallbackProvider && rule.fallbackEligible && isProviderEnabled(rule.fallbackProvider.status)) {
      fallbackProviders.push(toCandidate(rule.fallbackProvider, rule.id, rule.priority + 1));
      trace.add("FALLBACK_PROVIDER_ADDED", "PASS", `${rule.fallbackProvider.name} available if primary fails.`, rule.fallbackProvider.id, rule.id);
    }

    trace.add("PRIMARY_PROVIDER_SELECTED", "SELECT", `${rule.provider.name} selected.`, rule.providerId, rule.id);
    return {
      normalizedDestination: destination.e164,
      countryCode: detection.isoCode,
      dialCode: detection.dialCode,
      allowed: true,
      selectedProvider: primary,
      selectedCallerNumber: callerNumber
        ? { id: callerNumber.id, number: callerNumber.number, maskedNumber: maskPhoneNumber(callerNumber.number) }
        : null,
      matchedRuleId: rule.id,
      fallbackProviders,
      decisionTrace: trace.steps,
    };
  }

  return {
    normalizedDestination: destination.e164,
    countryCode: detection.isoCode,
    dialCode: detection.dialCode,
    allowed: false,
    selectedProvider: null,
    selectedCallerNumber: callerNumber
      ? { id: callerNumber.id, number: callerNumber.number, maskedNumber: maskPhoneNumber(callerNumber.number) }
      : null,
    matchedRuleId: null,
    fallbackProviders,
    decisionTrace: trace.add("NO_ROUTE_AVAILABLE", "FAIL", "No provider passed routing checks.").steps,
    rejectionCode: "NO_ROUTE_AVAILABLE",
    rejectionMessage: "No provider passed routing checks.",
  };
}

export async function assertRoutingAllowed(input: EvaluateRoutingInput) {
  const decision = await evaluateRoutingDecision(input);
  if (!decision.allowed || !decision.selectedProvider) {
    throw new TelecomError(
      (decision.rejectionCode as any) || "NO_ROUTE_AVAILABLE",
      decision.rejectionMessage || "No route is available.",
      decision.rejectionCode === "DESTINATION_BLOCKED" ? 403 : 404
    );
  }
  return decision;
}

async function resolveAuthorizedCallerNumber(input: {
  tenantId: string;
  callerNumberId?: string | null;
  from?: string | null;
  destinationCountry: string;
  defaultCountry?: string | null;
  required: boolean;
}) {
  if (input.callerNumberId) {
    const number = await prisma.phoneNumber.findFirst({
      where: {
        id: input.callerNumberId,
        tenantId: input.tenantId,
        callerIdAllowed: true,
        verifiedStatus: { in: ["verified", "VERIFIED", "provider_authorized"] },
      },
    });
    if (!number) {
      throw new TelecomError("CALLER_ID_UNAUTHORIZED", "Requested caller ID is not assigned, verified, and enabled for this tenant.", 403);
    }
    return number;
  }

  if (input.from) {
    const normalized = normalizeToE164(input.from, input.defaultCountry || input.destinationCountry);
    const number = await prisma.phoneNumber.findFirst({
      where: {
        tenantId: input.tenantId,
        number: normalized,
        callerIdAllowed: true,
        verifiedStatus: { in: ["verified", "VERIFIED", "provider_authorized"] },
      },
    });
    if (!number) {
      throw new TelecomError("CALLER_ID_UNVERIFIED", "Caller ID must be tenant-owned, verified, and enabled for outbound calling.", 403);
    }
    return number;
  }

  const number = await prisma.phoneNumber.findFirst({
    where: {
      tenantId: input.tenantId,
      countryCode: input.destinationCountry,
      callerIdAllowed: true,
      verifiedStatus: { in: ["verified", "VERIFIED", "provider_authorized"] },
      type: { in: ["outbound", "both"] },
    },
    orderBy: { createdAt: "asc" },
  }) || await prisma.phoneNumber.findFirst({
    where: {
      tenantId: input.tenantId,
      callerIdAllowed: true,
      verifiedStatus: { in: ["verified", "VERIFIED", "provider_authorized"] },
      type: { in: ["outbound", "both"] },
    },
    orderBy: { createdAt: "asc" },
  });

  if (number || !input.required) return number;
  throw new TelecomError("CALLER_ID_REQUIRED", "A verified tenant caller ID is required before outbound calling.", 403);
}

function toCandidate(provider: any, routingRuleId: string, priority: number): ProviderCandidate {
  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    countryCode: provider.countryCode,
    status: provider.status,
    healthStatus: provider.healthStatus,
    priority,
    routingRuleId,
  };
}

function isProviderEnabled(status: string) {
  return status === "ACTIVE";
}

function rejected(
  traceCode: string,
  rejectionCode: string,
  rejectionMessage: string,
  trace: ReturnType<typeof createTrace>
): RoutingDecision {
  trace.add(traceCode, "FAIL", rejectionMessage);
  return {
    normalizedDestination: "",
    countryCode: "",
    dialCode: "",
    allowed: false,
    selectedProvider: null,
    selectedCallerNumber: null,
    matchedRuleId: null,
    fallbackProviders: [],
    decisionTrace: trace.steps,
    rejectionCode,
    rejectionMessage,
  };
}

function createTrace() {
  const steps: RoutingDecisionStep[] = [];
  return {
    steps,
    add(code: string, result: RoutingDecisionStep["result"], message: string, providerId?: string, routingRuleId?: string) {
      steps.push({ order: steps.length + 1, code, result, message, providerId, routingRuleId });
      return this;
    },
  };
}
