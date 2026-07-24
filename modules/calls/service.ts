import { auth } from "@/lib/auth";
import { decryptIntegrationCredentials, encryptIntegrationCredentials } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { getCurrentTenantContext, requireRole, TenantForbiddenError } from "@/lib/tenant";
import { assertTelecomActivationAllowed } from "./activation";
import { TelecomError } from "./errors";
import { validateTelecomProviderEnv } from "./env";
import { classifyProviderFailure, isFallbackEligible, isUncertainProviderInvocationError } from "./failure";
import { createDeterministicEventId, createRequestFingerprint } from "./idempotency";
import { logTelecomEvent } from "./observability";
import { detectCallingCountry, normalizeCountryCode, normalizeToE164 } from "./phone";
import { recordProviderOutcome } from "./provider-health";
import { AsteriskProvider } from "./providers/AsteriskProvider";
import { TwilioProvider, validateTwilioSignature } from "./providers/TwilioProvider";
import type { ProviderWebhookResult, VoiceProvider } from "./providers/VoiceProvider";
import { createLegacyRouteProjection, upsertLegacyCallLogProjection } from "./projections";
import { assertRoutingAllowed } from "./routing-engine";
import { routingRuleSchema, verifyPhoneNumberSchema } from "./schema";
import { assertValidTransition, canTransition, normalizeCallStatus } from "./state-machine";
import { enqueueTelecomJob } from "./telecom-jobs";
import { requireSingleWebhookMatch } from "./webhook-mapping";
import { validateAsteriskHmacWebhook } from "./webhook-security";

type ProviderRecord = {
  id: string;
  name: string;
  type: string;
  countryCode: string | null;
  credentialsEncrypted?: string | null;
};

type InitiateCallParams = {
  tenantId: string;
  userId?: string | null;
  from?: string | null;
  to: string;
  selectedCountry?: string | null;
  callerNumberId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
};

type InitiateCallResult = {
  call: {
    id: string;
    status: string;
  } | null;
  route: {
    id: string;
    status: string;
  } | null;
  provider: {
    id: string;
    name: string;
    type: string;
    countryCode: string | null;
  };
  idempotentReplay: boolean;
};

export async function ensureDefaultCountryProviders() {
  const pakistan = await prisma.provider.upsert({
    where: { name_countryCode: { name: "Pakistan Telco SIP", countryCode: "PK" } },
    update: {
      type: "local_sip",
      status: "ACTIVE",
      priority: 10,
      configJson: JSON.stringify({ gateway: "asterisk_freepbx", route: "pakistan_local_sip" }),
    },
    create: {
      name: "Pakistan Telco SIP",
      type: "local_sip",
      countryCode: "PK",
      status: "ACTIVE",
      priority: 10,
      configJson: JSON.stringify({ gateway: "asterisk_freepbx", route: "pakistan_local_sip" }),
    },
  });

  const twilioUs = await prisma.provider.upsert({
    where: { name_countryCode: { name: "Twilio Voice", countryCode: "US" } },
    update: {
      type: "twilio",
      status: "ACTIVE",
      priority: 20,
      configJson: JSON.stringify({ gateway: "twilio_voice", route: "usa_twilio" }),
    },
    create: {
      name: "Twilio Voice",
      type: "twilio",
      countryCode: "US",
      status: "ACTIVE",
      priority: 20,
      configJson: JSON.stringify({ gateway: "twilio_voice", route: "usa_twilio" }),
    },
  });

  const twilioUk = await prisma.provider.upsert({
    where: { name_countryCode: { name: "Twilio Voice", countryCode: "GB" } },
    update: {
      type: "twilio",
      status: "ACTIVE",
      priority: 20,
      configJson: JSON.stringify({ gateway: "twilio_voice", route: "uk_twilio" }),
    },
    create: {
      name: "Twilio Voice",
      type: "twilio",
      countryCode: "GB",
      status: "ACTIVE",
      priority: 20,
      configJson: JSON.stringify({ gateway: "twilio_voice", route: "uk_twilio" }),
    },
  });

  await prisma.countryRoutingRule.upsert({
    where: { isoCode_dialCode: { isoCode: "PK", dialCode: "+92" } },
    update: { providerId: pakistan.id, fallbackProviderId: null, isActive: true },
    create: {
      countryName: "Pakistan",
      isoCode: "PK",
      dialCode: "+92",
      providerId: pakistan.id,
      isActive: true,
    },
  });

  await prisma.countryRoutingRule.upsert({
    where: { isoCode_dialCode: { isoCode: "US", dialCode: "+1" } },
    update: { providerId: twilioUs.id, fallbackProviderId: null, isActive: true },
    create: {
      countryName: "United States",
      isoCode: "US",
      dialCode: "+1",
      providerId: twilioUs.id,
      isActive: true,
    },
  });

  await prisma.countryRoutingRule.upsert({
    where: { isoCode_dialCode: { isoCode: "GB", dialCode: "+44" } },
    update: { providerId: twilioUk.id, fallbackProviderId: null, isActive: true },
    create: {
      countryName: "United Kingdom",
      isoCode: "GB",
      dialCode: "+44",
      providerId: twilioUk.id,
      isActive: true,
    },
  });
}

export async function listProvidersAndRouting() {
  await ensureDefaultCountryProviders();
  const [providers, rules] = await Promise.all([
    prisma.provider.findMany({
      orderBy: [{ priority: "asc" }, { countryCode: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        countryCode: true,
        status: true,
        priority: true,
        healthStatus: true,
        manualHealthStatus: true,
        lastHealthCheckAt: true,
        recentSuccessRate: true,
        temporaryFailures: true,
        permanentFailures: true,
        concurrentActiveCalls: true,
        healthMessage: true,
        configJson: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.countryRoutingRule.findMany({
      orderBy: { countryName: "asc" },
      include: {
        provider: { select: { id: true, name: true, type: true, countryCode: true, status: true, healthStatus: true } },
        fallbackProvider: { select: { id: true, name: true, type: true, countryCode: true, status: true, healthStatus: true } },
      },
    }),
  ]);

  return { providers, rules };
}

export async function initiateCountryRoutedCall(params: InitiateCallParams): Promise<InitiateCallResult> {
  validateTelecomProviderEnv();
  await assertOutboundRateLimit(params.tenantId);
  await ensureDefaultCountryProviders();

  const routingDecision = await assertRoutingAllowed({
    tenantId: params.tenantId,
    destination: params.to,
    callerNumberId: params.callerNumberId,
    from: params.from,
    selectedCountry: params.selectedCountry,
  });
  const toNumber = routingDecision.normalizedDestination;
  const callerNumber = routingDecision.selectedCallerNumber;
  const fromNumber = callerNumber?.number || null;
  const idempotencyKey = params.idempotencyKey || null;
  const fingerprint = idempotencyKey
    ? createRequestFingerprint({
        to: toNumber,
        from: fromNumber,
        callerNumberId: callerNumber?.id || null,
        selectedCountry: routingDecision.countryCode,
        metadata: params.metadata || {},
      })
    : null;

  const rule = await prisma.countryRoutingRule.findUnique({
    where: { id: routingDecision.matchedRuleId || "" },
    include: { provider: true, fallbackProvider: true },
  });

  if (!rule) {
    throw new TelecomError("NO_ROUTE_AVAILABLE", "No active provider route is configured for this destination.", 404);
  }

  const existing = idempotencyKey
    ? await prisma.call.findUnique({
        where: { tenantId_idempotencyKey: { tenantId: params.tenantId, idempotencyKey } },
        include: {
          attempts: { orderBy: { attemptNumber: "asc" }, include: { provider: true } },
          routes: { orderBy: { createdAt: "asc" } },
        },
      })
    : null;

  if (existing) {
    if (existing.requestFingerprint && existing.requestFingerprint !== fingerprint) {
      throw new TelecomError("IDEMPOTENCY_CONFLICT", "This idempotency key was already used for different call data.", 409);
    }
    return {
      call: existing ? { id: existing.id, status: existing.status } : null,
      route: existing.routes[0] ? { id: existing.routes[0].id, status: existing.routes[0].status } : null,
      provider: existing.attempts[0]?.provider || rule.provider,
      idempotentReplay: true,
    };
  }

  await assertTelecomActivationAllowed({
    tenantId: params.tenantId,
    providerId: rule.providerId,
    destinationE164: toNumber,
  });

  const created = await prisma.$transaction(async (tx) => {
    const call = await tx.call.create({
      data: {
        tenantId: params.tenantId,
        createdByUserId: params.userId || null,
        idempotencyKey,
        requestFingerprint: fingerprint,
        originalDestination: params.to,
        destinationE164: toNumber,
        destinationCountry: routingDecision.countryCode,
        callerNumberId: callerNumber?.id || null,
        status: "QUEUED",
        featureFlagSnapshot: JSON.stringify({
          twilio: process.env.VOICE_TWILIO_CALLING_ENABLED === "true",
          asterisk: process.env.VOICE_ASTERISK_CALLING_ENABLED === "true",
        }),
        decisionTraceJson: JSON.stringify(routingDecision.decisionTrace),
      },
    });

    const route = await createLegacyRouteProjection({
      callId: call.id,
      tenantId: params.tenantId,
      fromNumber,
      toNumber,
      detectedCountry: routingDecision.countryCode,
      selectedProviderId: rule.providerId,
      routeReason: `country=${routingDecision.countryCode}; selected ${rule.provider.name}`,
      status: "selected",
      db: tx,
    });

    const attempt = await tx.callAttempt.create({
      data: {
        tenantId: params.tenantId,
        callId: call.id,
        providerId: rule.providerId,
        routeRuleId: rule.id,
        callerNumberId: callerNumber?.id || null,
        destinationE164: toNumber,
        attemptNumber: 1,
        status: "QUEUED",
      },
    });

    await enqueueTelecomJob({
      type: "TELECOM_INITIATE_PROVIDER_CALL",
      idempotencyKey: idempotencyKey || call.id,
      tenantId: params.tenantId,
      callId: call.id,
      attemptId: attempt.id,
      providerId: rule.providerId,
      correlationId: call.id,
      entityType: "Call",
      entityId: call.id,
      metadata: {
        tenantId: params.tenantId,
        callId: call.id,
        attemptId: attempt.id,
      },
      db: tx,
    });

    return { call, route, attempt };
  });

  return {
    call: { id: created.call.id, status: created.call.status },
    route: { id: created.route.id, status: created.route.status },
    provider: rule.provider,
    idempotentReplay: false,
  };
}

export async function processQueuedCallInitiation(input: {
  callId?: string | null;
  attemptId?: string | null;
  tenantId?: string | null;
  correlationId?: string | null;
}) {
  const context = await loadQueuedCallContext(input.callId, input.attemptId, input.tenantId);
  if (!context) {
    throw new TelecomError("UNKNOWN_PROVIDER_CALL", "Queued telecom initiation could not resolve the call attempt.", 404);
  }

  const { call, attempt, route, rule, provider, fallbackProvider, callerNumber } = context;
  if (attempt.providerCallId || !["QUEUED", "INITIATING"].includes(attempt.status)) {
    return { skipped: true, reason: "attempt_already_processed" };
  }

  await assertTelecomActivationAllowed({
    tenantId: call.tenantId,
    providerId: provider.id,
    destinationE164: call.destinationE164,
  });

  await prisma.$transaction(async (tx) => {
    await tx.callAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "INITIATING",
        startedAt: attempt.startedAt || new Date(),
      },
    });
    await tx.call.update({
      where: { id: call.id },
      data: { status: "INITIATING" },
    });
  });

  try {
    const result = await instantiateProvider(provider).initiateCall(
      callerNumber?.number || null,
      call.destinationE164,
      call.tenantId,
      {
        routeId: route.id,
        callId: call.id,
        attemptId: attempt.id,
        detectedCountry: call.destinationCountry,
        correlationId: call.id,
      }
    );
    const nextStatus = normalizeCallStatus(result.status);

    await prisma.$transaction(async (tx) => {
      const currentCall = await tx.call.findUnique({ where: { id: call.id }, select: { status: true } });
      if (currentCall) {
        assertValidTransition(currentCall.status, nextStatus);
      }

      await tx.callRoute.update({
        where: { id: route.id },
        data: { status: result.status === "dry_run" ? "dry_run" : "initiated" },
      });

      await tx.callAttempt.update({
        where: { id: attempt.id },
        data: {
          providerCallId: result.externalCallId,
          status: nextStatus,
          rawProviderStatus: result.status,
        },
      });

      await tx.call.update({
        where: { id: call.id },
        data: {
          status: nextStatus,
          rawProviderStatus: result.status,
        },
      });

      await upsertLegacyCallLogProjection({
        callId: call.id,
        callAttemptId: attempt.id,
        tenantId: call.tenantId,
        providerId: provider.id,
        externalCallId: result.externalCallId,
        fromNumber: callerNumber?.number || null,
        toNumber: call.destinationE164,
        direction: "outbound",
        country: call.destinationCountry,
        callStatus: nextStatus,
        db: tx,
      });
    });

    await recordProviderOutcome(provider.id, { status: nextStatus });
    return { skipped: false, status: nextStatus };
  } catch (error) {
    const failureClass = classifyProviderFailure(error);
    const message = error instanceof Error ? error.message : "Provider attempt failed.";
    const uncertain = isUncertainProviderInvocationError(error);

    await prisma.$transaction(async (tx) => {
      await tx.callRoute.update({
        where: { id: route.id },
        data: {
          status: uncertain
            ? "provider_response_uncertain"
            : fallbackProvider && isFallbackEligible(failureClass)
              ? "fallback_pending"
              : "failed",
        },
      });

      await tx.callAttempt.update({
        where: { id: attempt.id },
        data: {
          status: uncertain ? "INITIATING" : "FAILED",
          failureClass,
          failureCode: uncertain ? "PROVIDER_RESPONSE_UNCERTAIN" : null,
          failureMessage: message,
          endedAt: uncertain ? null : new Date(),
        },
      });

      await tx.call.update({
        where: { id: call.id },
        data: {
          status: uncertain
            ? "INITIATING"
            : fallbackProvider && isFallbackEligible(failureClass)
              ? "QUEUED"
              : "FAILED",
          failureClass: uncertain || (fallbackProvider && isFallbackEligible(failureClass)) ? null : failureClass,
          failureCode: uncertain ? "PROVIDER_RESPONSE_UNCERTAIN" : null,
          failureMessage: uncertain || (fallbackProvider && isFallbackEligible(failureClass)) ? null : message,
        },
      });

      if (uncertain) {
        await enqueueTelecomJob({
          type: "TELECOM_RECONCILE_CALL",
          idempotencyKey: `${call.id}:uncertain-initiation:${attempt.id}`,
          tenantId: call.tenantId,
          callId: call.id,
          attemptId: attempt.id,
          correlationId: input.correlationId || call.id,
          entityType: "Call",
          entityId: call.id,
          metadata: { limit: 1 },
          db: tx,
        });
      } else if (fallbackProvider && rule.fallbackEligible && isFallbackEligible(failureClass)) {
        await enqueueTelecomJob({
          type: "TELECOM_EVALUATE_FALLBACK",
          idempotencyKey: `${call.id}:fallback:${attempt.id}`,
          tenantId: call.tenantId,
          callId: call.id,
          attemptId: attempt.id,
          providerId: fallbackProvider.id,
          correlationId: call.id,
          entityType: "Call",
          entityId: call.id,
          metadata: {
            tenantId: call.tenantId,
            callId: call.id,
            failedAttemptId: attempt.id,
          },
          db: tx,
        });
      }
    });

    await recordProviderOutcome(provider.id, { status: "FAILED", failureClass });
    if (uncertain) {
      return { skipped: false, status: "INITIATING", uncertainProviderResponse: true };
    }
    if (fallbackProvider && rule.fallbackEligible && isFallbackEligible(failureClass)) {
      return { skipped: false, status: "QUEUED", fallbackQueued: true };
    }
    throw error;
  }
}

export async function processQueuedFallbackAttempt(input: {
  callId?: string | null;
  failedAttemptId?: string | null;
  tenantId?: string | null;
  correlationId?: string | null;
}) {
  if (!input.callId) {
    throw new TelecomError("UNKNOWN_PROVIDER_CALL", "Fallback job is missing a call id.", 400);
  }

  const call = await prisma.call.findUnique({
    where: { id: input.callId },
    include: {
      callerNumber: true,
      routes: { orderBy: { createdAt: "asc" }, take: 1 },
      attempts: {
        orderBy: { attemptNumber: "asc" },
        include: { provider: true, routeRule: { include: { fallbackProvider: true } } },
      },
    },
  });
  if (!call || (input.tenantId && call.tenantId !== input.tenantId)) {
    throw new TelecomError("UNKNOWN_PROVIDER_CALL", "Fallback job could not resolve the call.", 404);
  }

  const failedAttempt = call.attempts.find((attempt) => attempt.id === input.failedAttemptId) || call.attempts[0];
  const rule = failedAttempt?.routeRule;
  const fallbackProvider = rule?.fallbackProvider;
  const route = call.routes[0];

  if (!failedAttempt || !rule || !fallbackProvider || !route) {
    throw new TelecomError("NO_ROUTE_AVAILABLE", "No fallback route is configured for this call.", 404);
  }

  const existingFallback = call.attempts.find((attempt) => attempt.attemptNumber === failedAttempt.attemptNumber + 1);
  if (existingFallback?.providerCallId || (existingFallback && !["QUEUED", "INITIATING"].includes(existingFallback.status))) {
    return { skipped: true, reason: "fallback_already_processed" };
  }

  await assertTelecomActivationAllowed({
    tenantId: call.tenantId,
    providerId: fallbackProvider.id,
    destinationE164: call.destinationE164,
  });

  const fallbackAttempt = existingFallback || await prisma.callAttempt.create({
    data: {
      tenantId: call.tenantId,
      callId: call.id,
      providerId: fallbackProvider.id,
      routeRuleId: rule.id,
      callerNumberId: call.callerNumberId,
      destinationE164: call.destinationE164,
      attemptNumber: failedAttempt.attemptNumber + 1,
      status: "QUEUED",
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.call.update({
      where: { id: call.id },
      data: { status: "INITIATING" },
    });
    await tx.callAttempt.update({
      where: { id: fallbackAttempt.id },
      data: {
        status: "INITIATING",
        startedAt: fallbackAttempt.startedAt || new Date(),
      },
    });
  });

  try {
    const result = await instantiateProvider(fallbackProvider).initiateCall(
      call.callerNumber?.number || null,
      call.destinationE164,
      call.tenantId,
      {
        routeId: route.id,
        callId: call.id,
        attemptId: fallbackAttempt.id,
        fallbackFromProviderId: failedAttempt.providerId,
        detectedCountry: call.destinationCountry,
        correlationId: call.id,
      }
    );
    const fallbackStatus = normalizeCallStatus(result.status);

    await prisma.$transaction(async (tx) => {
      await tx.callAttempt.update({
        where: { id: fallbackAttempt.id },
        data: {
          providerCallId: result.externalCallId,
          status: fallbackStatus,
          rawProviderStatus: result.status,
        },
      });

      await tx.callRoute.update({
        where: { id: route.id },
        data: {
          selectedProviderId: fallbackProvider.id,
          status: result.status === "dry_run" ? "fallback_dry_run" : "fallback_initiated",
          routeReason: `${route.routeReason}; fallback ${fallbackProvider.name}`,
        },
      });

      await tx.call.update({
        where: { id: call.id },
        data: {
          status: fallbackStatus,
          rawProviderStatus: result.status,
        },
      });

      await upsertLegacyCallLogProjection({
        callId: call.id,
        callAttemptId: fallbackAttempt.id,
        tenantId: call.tenantId,
        providerId: fallbackProvider.id,
        externalCallId: result.externalCallId,
        fromNumber: call.callerNumber?.number || null,
        toNumber: call.destinationE164,
        direction: "outbound",
        country: call.destinationCountry,
        callStatus: fallbackStatus,
        db: tx,
      });
    });

    await recordProviderOutcome(fallbackProvider.id, { status: fallbackStatus });
    return { skipped: false, status: fallbackStatus };
  } catch (error) {
    if (!isUncertainProviderInvocationError(error)) {
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.callAttempt.update({
        where: { id: fallbackAttempt.id },
        data: {
          status: "INITIATING",
          failureCode: "PROVIDER_RESPONSE_UNCERTAIN",
          failureMessage: error instanceof Error ? error.message : "Fallback provider response uncertain.",
        },
      });
      await tx.callRoute.update({
        where: { id: route.id },
        data: {
          status: "fallback_provider_response_uncertain",
          selectedProviderId: fallbackProvider.id,
          routeReason: `${route.routeReason}; fallback uncertain ${fallbackProvider.name}`,
        },
      });
      await tx.call.update({
        where: { id: call.id },
        data: {
          status: "INITIATING",
          failureCode: "PROVIDER_RESPONSE_UNCERTAIN",
          failureMessage: null,
        },
      });
      await enqueueTelecomJob({
        type: "TELECOM_RECONCILE_CALL",
        idempotencyKey: `${call.id}:fallback-uncertain:${fallbackAttempt.id}`,
        tenantId: call.tenantId,
        callId: call.id,
        attemptId: fallbackAttempt.id,
        correlationId: input.correlationId || call.id,
        entityType: "Call",
        entityId: call.id,
        metadata: { limit: 1 },
        db: tx,
      });
    });

    return { skipped: false, status: "INITIATING", uncertainProviderResponse: true };
  }
}

export async function saveProviderWebhook(providerType: "twilio" | "asterisk", payload: Record<string, unknown>) {
  const startedAt = Date.now();
  logTelecomEvent("webhook.valid_received", { provider: providerType });
  const adapter = createWebhookAdapter(providerType);
  const event = await adapter.handleWebhook(payload);
  const provider = await findProviderForWebhook(providerType, payload, event);

  if (!provider || !event.externalCallId) {
    logTelecomEvent("webhook.unknown_provider_call", { provider: providerType });
    throw new TelecomError("UNKNOWN_PROVIDER_CALL", "Webhook could not be mapped to a provider and external call id.", 404);
  }

  const mapping = await resolveWebhookCallMapping(provider.id, event);
  if (!mapping) {
    logTelecomEvent("webhook.unknown_tenant_mapping", { provider: providerType, providerId: provider.id, providerCallId: event.externalCallId });
    throw new TelecomError("UNKNOWN_TENANT_MAPPING", "Webhook could not be mapped to a tenant. Refusing unsafe fallback.", 404);
  }

  const providerEventId = readProviderEventId(providerType, payload);
  const normalizedStatus = normalizeCallStatus(event.callStatus);
  const existingEvent = await prisma.callEvent.findUnique({
    where: { provider_providerEventId: { provider: providerType, providerEventId } },
  });
  if (existingEvent) {
    logTelecomEvent("webhook.duplicate_event_ignored", {
      provider: providerType,
      providerId: provider.id,
      providerCallId: event.externalCallId,
      callId: mapping.callId,
      attemptId: mapping.attemptId,
      tenantId: mapping.tenantId,
    });
    return prisma.callLog.findFirst({
      where: { providerId: provider.id, externalCallId: event.externalCallId },
    });
  }

  return prisma.$transaction(async (tx) => {
    const callEvent = await tx.callEvent.create({
      data: {
        tenantId: mapping.tenantId,
        callId: mapping.callId,
        callAttemptId: mapping.attemptId,
        provider: providerType,
        providerEventId,
        providerStatus: event.callStatus,
        normalizedStatus,
        eventType: "provider_status",
        rawPayload: redactPayload(payload),
        occurredAt: readProviderOccurredAt(payload),
        processedAt: new Date(),
      },
    });

    const attempt = await tx.callAttempt.findUnique({
      where: { id: mapping.attemptId },
      select: { status: true },
    });
    if (attempt && canTransition(attempt.status, normalizedStatus)) {
      await tx.callAttempt.update({
        where: { id: mapping.attemptId },
        data: {
          status: normalizedStatus,
          rawProviderStatus: event.callStatus,
          answeredAt: normalizedStatus === "IN_PROGRESS" ? new Date() : undefined,
          endedAt: ["COMPLETED", "FAILED", "BUSY", "NO_ANSWER", "CANCELLED"].includes(normalizedStatus) ? new Date() : undefined,
        },
      });
    } else if (attempt) {
      logTelecomEvent("webhook.stale_attempt_transition_ignored", {
        provider: providerType,
        callId: mapping.callId,
        attemptId: mapping.attemptId,
        tenantId: mapping.tenantId,
        fromStatus: attempt.status,
        toStatus: normalizedStatus,
      });
    }

    const call = await tx.call.findUnique({
      where: { id: mapping.callId },
      select: { status: true },
    });
    if (call && canTransition(call.status, normalizedStatus)) {
      await tx.call.update({
        where: { id: mapping.callId },
        data: {
          status: normalizedStatus,
          rawProviderStatus: event.callStatus,
        },
      });
    } else if (call) {
      logTelecomEvent("webhook.stale_call_transition_ignored", {
        provider: providerType,
        callId: mapping.callId,
        attemptId: mapping.attemptId,
        tenantId: mapping.tenantId,
        fromStatus: call.status,
        toStatus: normalizedStatus,
      });
    }

    const callLog = await tx.callLog.upsert({
      where: { providerId_externalCallId: { providerId: provider.id, externalCallId: event.externalCallId! } },
      update: {
        callId: mapping.callId,
        callAttemptId: mapping.attemptId,
        tenantId: mapping.tenantId,
        fromNumber: event.fromNumber || undefined,
        toNumber: event.toNumber || undefined,
        direction: event.direction,
        country: event.country || undefined,
        callStatus: normalizedStatus,
        duration: event.duration ?? undefined,
        recordingUrl: event.recordingUrl || undefined,
        transcriptId: event.transcriptId || undefined,
        cost: typeof event.cost === "number" ? event.cost : undefined,
        currency: event.currency || undefined,
      },
      create: {
        callId: mapping.callId,
        callAttemptId: mapping.attemptId,
        tenantId: mapping.tenantId,
        providerId: provider.id,
        externalCallId: event.externalCallId,
        fromNumber: event.fromNumber,
        toNumber: event.toNumber,
        direction: event.direction,
        country: event.country,
        callStatus: normalizedStatus,
        duration: event.duration ?? undefined,
        recordingUrl: event.recordingUrl,
        transcriptId: event.transcriptId,
        cost: typeof event.cost === "number" ? event.cost : undefined,
        currency: event.currency,
      },
    });

    logTelecomEvent("webhook.processed", {
      provider: providerType,
      providerId: provider.id,
      providerCallId: event.externalCallId,
      callId: mapping.callId,
      attemptId: mapping.attemptId,
      tenantId: mapping.tenantId,
      durationMs: Date.now() - startedAt,
    });

    return { ...callLog, callEventId: callEvent.id };
  });
}

export async function verifyTenantPhoneNumber(input: unknown) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const parsed = verifyPhoneNumberSchema.parse(input);
  await ensureDefaultCountryProviders();

  const countryCode = normalizeCountryCode(parsed.countryCode);
  if (!countryCode) {
    throw new Error("Only Pakistan, USA, and UK numbers can be verified in this release.");
  }

  const number = normalizeToE164(parsed.number, countryCode);
  const detection = detectCallingCountry(number, countryCode);
  const rule = await prisma.countryRoutingRule.findFirst({
    where: { isoCode: detection.isoCode, isActive: true },
    include: { provider: true },
  });

  if (!rule) {
    throw new Error(`No active provider is configured for ${detection.countryName}.`);
  }

  return prisma.phoneNumber.upsert({
    where: { tenantId_number: { tenantId: ctx.organizationId, number } },
    update: {
      countryCode: detection.isoCode,
      providerId: rule.providerId,
      type: parsed.type,
      verifiedStatus: "pending_verification",
      callerIdAllowed: false,
    },
    create: {
      tenantId: ctx.organizationId,
      number,
      countryCode: detection.isoCode,
      providerId: rule.providerId,
      type: parsed.type,
      verifiedStatus: "pending_verification",
      callerIdAllowed: false,
    },
  });
}

export async function saveRoutingRule(input: unknown) {
  const session = await auth();
  if (!isPlatformAdminEmail(session?.user?.email)) {
    throw new TenantForbiddenError("Only platform admins can change telecom routing rules.");
  }

  const parsed = routingRuleSchema.parse(input);
  const rule = await prisma.countryRoutingRule.upsert({
    where: { isoCode_dialCode: { isoCode: parsed.isoCode.toUpperCase(), dialCode: parsed.dialCode } },
    update: {
      tenantId: parsed.tenantId || null,
      countryName: parsed.countryName,
      prefix: parsed.prefix || null,
      providerId: parsed.providerId,
      fallbackProviderId: parsed.fallbackProviderId || null,
      isActive: parsed.isActive,
      priority: parsed.priority,
      weight: parsed.weight,
      validFrom: parsed.validFrom ? new Date(parsed.validFrom) : null,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
      maxConcurrentCalls: parsed.maxConcurrentCalls || null,
      callsPerSecond: parsed.callsPerSecond || null,
      requireHealthyProvider: parsed.requireHealthyProvider,
      fallbackEligible: parsed.fallbackEligible,
      emergencyOverride: parsed.emergencyOverride,
      businessHoursJson: parsed.businessHoursJson || null,
    },
    create: {
      tenantId: parsed.tenantId || null,
      countryName: parsed.countryName,
      isoCode: parsed.isoCode.toUpperCase(),
      dialCode: parsed.dialCode,
      prefix: parsed.prefix || null,
      providerId: parsed.providerId,
      fallbackProviderId: parsed.fallbackProviderId || null,
      isActive: parsed.isActive,
      priority: parsed.priority,
      weight: parsed.weight,
      validFrom: parsed.validFrom ? new Date(parsed.validFrom) : null,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
      maxConcurrentCalls: parsed.maxConcurrentCalls || null,
      callsPerSecond: parsed.callsPerSecond || null,
      requireHealthyProvider: parsed.requireHealthyProvider,
      fallbackEligible: parsed.fallbackEligible,
      emergencyOverride: parsed.emergencyOverride,
      businessHoursJson: parsed.businessHoursJson || null,
    },
  });

  const ctx = await getOptionalTenantContext();
  if (ctx && session?.user?.id) {
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: session.user.id,
        action: "telecom.routing_rule.updated",
        entityType: "CountryRoutingRule",
        entityId: rule.id,
        details: JSON.stringify({ isoCode: rule.isoCode, dialCode: rule.dialCode, providerId: rule.providerId }),
      },
    });
  }

  return rule;
}

export async function validateAsteriskWebhook(request: Request, rawBody: string) {
  const url = new URL(request.url);
  return validateAsteriskHmacWebhook({
    method: request.method,
    pathname: url.pathname,
    rawBody,
    timestamp: request.headers.get("x-wq-timestamp"),
    nonce: request.headers.get("x-wq-nonce"),
    signature: request.headers.get("x-wq-signature"),
  });
}

export async function validateTwilioWebhook(request: Request, formPayload: Record<string, string>) {
  const authToken = process.env.VOICE_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
  if (!authToken && process.env.NODE_ENV !== "production") return true;
  if (!authToken) return false;

  const publicUrl = process.env.VOICE_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  const requestUrl = new URL(request.url);
  const validationUrl = publicUrl
    ? `${publicUrl.replace(/\/$/, "")}${requestUrl.pathname}${requestUrl.search}`
    : request.url;

  return validateTwilioSignature({
    authToken,
    url: validationUrl,
    payload: formPayload,
    signature: request.headers.get("x-twilio-signature"),
  });
}

export function encryptedProviderCredentials(credentials: Record<string, string>) {
  return encryptIntegrationCredentials(credentials);
}

async function assertOutboundRateLimit(tenantId: string) {
  const configuredLimit = Number(process.env.VOICE_OUTBOUND_CALLS_PER_MINUTE || 10);
  const limit =
    Number.isInteger(configuredLimit) && configuredLimit > 0
      ? configuredLimit
      : 10;
  const result = await checkRateLimit(
    rateLimitKey("voice:outbound-call", tenantId),
    { limit, windowMs: 60_000 },
  );
  if (!result.allowed) {
    throw new TelecomError("RATE_LIMITED", "Outbound calling rate limit reached. Please wait and try again.", 429);
  }
}

function instantiateProvider(provider: ProviderRecord | null): VoiceProvider {
  if (!provider) {
    throw new Error("Provider is required.");
  }

  if (provider.type === "local_sip") {
    return new AsteriskProvider();
  }

  if (provider.type === "twilio") {
    const encrypted = "credentialsEncrypted" in provider ? provider.credentialsEncrypted : null;
    const credentials = encrypted ? decryptIntegrationCredentials(encrypted) : {};
    return new TwilioProvider({
      accountSid: stringCredential(credentials.accountSid),
      authToken: stringCredential(credentials.authToken),
      fromNumber: stringCredential(credentials.fromNumber),
    });
  }

  throw new Error(`Unsupported voice provider type: ${provider.type}`);
}

async function loadQueuedCallContext(callId?: string | null, attemptId?: string | null, tenantId?: string | null) {
  const call = callId
    ? await prisma.call.findUnique({
        where: { id: callId },
        include: {
          callerNumber: true,
          routes: { orderBy: { createdAt: "asc" }, take: 1 },
          attempts: {
            orderBy: { attemptNumber: "asc" },
            include: {
              provider: true,
              routeRule: {
                include: {
                  provider: true,
                  fallbackProvider: true,
                },
              },
            },
          },
        },
      })
    : null;

  if (!call || (tenantId && call.tenantId !== tenantId)) {
    return null;
  }

  const attempt = (attemptId ? call.attempts.find((row) => row.id === attemptId) : call.attempts[0]) || null;
  const route = call.routes[0] || null;
  const rule = attempt?.routeRule || null;
  if (!attempt || !route || !rule) {
    return null;
  }

  return {
    call,
    attempt,
    route,
    rule,
    provider: rule.provider,
    fallbackProvider: rule.fallbackProvider,
    callerNumber: call.callerNumber,
  };
}

async function resolveWebhookCallMapping(providerId: string, event: ProviderWebhookResult) {
  if (event.externalCallId) {
    const attempt = await prisma.callAttempt.findUnique({
      where: { providerId_providerCallId: { providerId, providerCallId: event.externalCallId } },
      select: { id: true, callId: true, tenantId: true },
    });
    if (attempt) {
      return { tenantId: attempt.tenantId, callId: attempt.callId, attemptId: attempt.id };
    }

    const existingLog = await prisma.callLog.findUnique({
      where: { providerId_externalCallId: { providerId, externalCallId: event.externalCallId } },
      select: { tenantId: true, callId: true, callAttemptId: true },
    });
    if (existingLog?.callId && existingLog.callAttemptId) {
      return { tenantId: existingLog.tenantId, callId: existingLog.callId, attemptId: existingLog.callAttemptId };
    }
  }
  return null;
}

function readProviderEventId(providerType: "twilio" | "asterisk", payload: Record<string, unknown>) {
  const explicit =
    payload.EventSid ||
    payload.eventSid ||
    payload.eventId ||
    payload.id ||
    payload.SequenceNumber ||
    payload.sequence;
  if (typeof explicit === "string" && explicit.trim()) {
    return `${providerType}:${explicit.trim()}`;
  }
  return `${providerType}:${createDeterministicEventId(providerType, payload)}`;
}

function readProviderOccurredAt(payload: Record<string, unknown>) {
  const raw = payload.Timestamp || payload.timestamp || payload.eventTime || payload.createdAt;
  if (typeof raw !== "string") return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function redactPayload(payload: Record<string, unknown>) {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (/token|secret|password|authorization|auth/i.test(key)) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
  }
  return JSON.stringify(redacted);
}

async function getOptionalTenantContext() {
  try {
    return await getCurrentTenantContext();
  } catch {
    return null;
  }
}

function stringCredential(value: unknown) {
  return typeof value === "string" ? value : null;
}

function createWebhookAdapter(providerType: "twilio" | "asterisk"): VoiceProvider {
  if (providerType === "twilio") {
    return new TwilioProvider();
  }
  return new AsteriskProvider();
}

async function findProviderForWebhook(
  providerType: "twilio" | "asterisk",
  payload: Record<string, unknown>,
  event: ProviderWebhookResult
) {
  if (event.externalCallId) {
    const providerFromAttempt = requireSingleWebhookMatch(
      await prisma.callAttempt.findMany({
        where: {
          providerCallId: event.externalCallId,
          provider: { type: providerType },
        },
        select: {
          provider: {
            select: {
              id: true,
              name: true,
              type: true,
              countryCode: true,
              credentialsEncrypted: true,
            },
          },
        },
      }),
      "provider call id"
    );
    if (providerFromAttempt) {
      return providerFromAttempt.provider;
    }

    const providerFromLog = requireSingleWebhookMatch(
      await prisma.callLog.findMany({
        where: {
          externalCallId: event.externalCallId,
          provider: { type: providerType },
        },
        select: {
          provider: {
            select: {
              id: true,
              name: true,
              type: true,
              countryCode: true,
              credentialsEncrypted: true,
            },
          },
        },
      }),
      "provider call log"
    );
    if (providerFromLog?.provider) {
      return providerFromLog.provider;
    }
  }

  const candidateNumbers = [event.toNumber, event.fromNumber, typeof payload.To === "string" ? payload.To : null]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  for (const number of candidateNumbers) {
    const match = requireSingleWebhookMatch(
      await prisma.phoneNumber.findMany({
        where: {
          number,
          provider: { type: providerType },
        },
        select: {
          provider: {
            select: {
              id: true,
              name: true,
              type: true,
              countryCode: true,
              credentialsEncrypted: true,
            },
          },
        },
      }),
      "phone-number ownership"
    );
    if (match?.provider) {
      return match.provider;
    }
  }

  if (providerType === "asterisk") {
    return requireSingleWebhookMatch(
      await prisma.provider.findMany({
        where: { type: "local_sip", status: "ACTIVE", countryCode: "PK" },
        select: {
          id: true,
          name: true,
          type: true,
          countryCode: true,
          credentialsEncrypted: true,
        },
      }),
      "active asterisk provider"
    );
  }

  return null;
}
