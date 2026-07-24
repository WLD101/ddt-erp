import crypto from "node:crypto";

import { resolveIndustryProfileFromLegacyIndustry, type IndustryProfileKey } from "@/modules/onboarding/industry-profiles";
import { writeAuditLog } from "@/lib/audit";
import type { ScopedPrisma } from "@/lib/db/client";
import type { TenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

import { getIntegrationActionDefinition } from "./core/action-registry";
import { beginIdempotentExecution, createIntegrationRequestHash } from "./core/idempotency";
import { IntegrationError, toSafeIntegrationError } from "./core/errors";
import { evaluateIntegrationHealth } from "./core/health";
import { validateOAuthState, createOAuthState, type OAuthStateStore } from "./core/oauth";
import { evaluateIntegrationPermission } from "./core/permissions";
import { getIntegrationProviderAdapter } from "./core/provider-adapters";
import { enforceRateLimit } from "./core/rate-limit";
import { getIntegrationProviderDefinition } from "./core/registry";
import { getIntegrationRecommendations } from "./core/recommendations";
import { integrationCredentialVault } from "./core/vault";
import { getAvailableVoiceTools } from "./core/voice-tools";
import { assertIntegrationStatusTransition } from "./core/state-machine";
import type {
  IntegrationActionRequest,
  IntegrationConnectionStatus,
  IntegrationExecutionContext,
  TenantIntegrationRecord,
} from "./core/types";

function parseJsonArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject<T extends Record<string, unknown>>(value: string | null | undefined): T {
  if (!value) return {} as T;
  try {
    const parsed = JSON.parse(value) as T;
    return parsed && typeof parsed === "object" ? parsed : ({} as T);
  } catch {
    return {} as T;
  }
}

function periodKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function toTenantIntegrationRecord(record: any): TenantIntegrationRecord {
  return {
    id: record.id,
    organizationId: record.organizationId,
    branchId: record.branchId,
    providerKey: record.providerKey,
    connectionName: record.connectionName,
    externalAccountId: record.externalAccountId,
    externalAccountName: record.externalAccountName,
    status: record.status,
    healthStatus: record.healthStatus,
    encryptedCredentials: record.encryptedCredentials,
    credentialVersion: record.credentialVersion,
    grantedScopes: parseJsonArray<string>(record.grantedScopes),
    selectedResources: parseJsonArray<Record<string, unknown>>(record.selectedResources),
    configuration: parseJsonObject<Record<string, unknown>>(record.configuration),
    fieldMappings: parseJsonArray<Record<string, unknown>>(record.fieldMappings),
    lastConnectedAt: record.lastConnectedAt,
    lastTestedAt: record.lastTestedAt,
    lastSuccessfulAt: record.lastSuccessfulAt,
    lastSyncAt: record.lastSyncAt,
    expiresAt: record.expiresAt,
    failureCount: record.failureCount,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function resolveTenantIndustryProfileKey(organization: { industryProfileKey?: string | null; industry?: string | null }) {
  return (
    (organization.industryProfileKey as IndustryProfileKey | null | undefined) ||
    resolveIndustryProfileFromLegacyIndustry(organization.industry || null)
  );
}

async function getTenantIntegrationOrThrow(db: ScopedPrisma, id: string) {
  const integration = await db.tenantIntegration.findUnique({ where: { id } });
  if (!integration) {
    throw new IntegrationError("INTEGRATION_NOT_FOUND", "Integration connection not found.", { statusCode: 404 });
  }
  return integration;
}

async function buildExecutionContext(db: ScopedPrisma, integrationId: string, input: {
  requestSource: IntegrationExecutionContext["requestSource"];
  userId?: string;
  voiceAgentId?: string;
  callId?: string;
  correlationId?: string;
}) : Promise<IntegrationExecutionContext & { integration: TenantIntegrationRecord }> {
  const record = await getTenantIntegrationOrThrow(db, integrationId);
  const integration = toTenantIntegrationRecord(record);
  const credentials = integration.encryptedCredentials
    ? await integrationCredentialVault.decrypt(integration.encryptedCredentials)
    : {};

  return {
    tenantId: integration.organizationId,
    branchId: integration.branchId || undefined,
    tenantIntegrationId: integration.id,
    providerKey: integration.providerKey,
    userId: input.userId,
    voiceAgentId: input.voiceAgentId,
    callId: input.callId,
    correlationId: input.correlationId || crypto.randomUUID(),
    requestSource: input.requestSource,
    credentials,
    configuration: integration.configuration,
    selectedResources: integration.selectedResources,
    integration,
  };
}

const prismaOAuthStateStore: OAuthStateStore = {
  async save(record) {
    await prisma.integrationOAuthState.create({
      data: {
        organizationId: record.tenantId,
        stateId: record.stateId,
        userId: record.userId,
        providerKey: record.providerKey,
        redirectPath: record.redirectPath,
        codeVerifierEncrypted: record.codeVerifierEncrypted,
        signature: record.signature,
        expiresAt: record.expiresAt,
      },
    });
  },
  async findByStateId(stateId) {
    const record = await prisma.integrationOAuthState.findUnique({ where: { stateId } });
    if (!record) return null;
    return {
      stateId: record.stateId,
      tenantId: record.organizationId,
      userId: record.userId,
      providerKey: record.providerKey,
      redirectPath: record.redirectPath,
      codeVerifierEncrypted: record.codeVerifierEncrypted,
      signature: record.signature,
      expiresAt: record.expiresAt,
      consumedAt: record.consumedAt,
    };
  },
  async consume(stateId, consumedAt) {
    const result = await prisma.integrationOAuthState.updateMany({
      where: {
        stateId,
        consumedAt: null,
        expiresAt: { gt: consumedAt },
      },
      data: { consumedAt },
    });
    return result.count === 1;
  },
};

export async function listIntegrationProvidersForTenant(db: ScopedPrisma, input?: { industryProfileKey?: IndustryProfileKey | null }) {
  const connected = await db.tenantIntegration.findMany({
    select: { providerKey: true },
  });
  return getIntegrationRecommendations({
    industryProfileKey: input?.industryProfileKey,
    connectedProviderKeys: connected.map((item) => item.providerKey),
  });
}

export async function listTenantConnections(db: ScopedPrisma) {
  const records = await db.tenantIntegration.findMany({
    orderBy: { createdAt: "desc" },
  });
  return records.map(toTenantIntegrationRecord);
}

export async function getTenantConnectionDetails(db: ScopedPrisma, id: string) {
  const record = await getTenantIntegrationOrThrow(db, id);
  const [resources, permissions, recentActivity, healthChecks] = await Promise.all([
    db.integrationResource.findMany({ where: { tenantIntegrationId: id }, orderBy: { createdAt: "desc" } }),
    db.integrationPermission.findMany({ where: { tenantIntegrationId: id }, orderBy: { createdAt: "desc" } }),
    db.integrationActionLog.findMany({ where: { tenantIntegrationId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.integrationHealthCheck.findMany({ where: { tenantIntegrationId: id }, orderBy: { checkedAt: "desc" }, take: 10 }),
  ]);

  return {
    connection: toTenantIntegrationRecord(record),
    resources: resources.map((resource) => ({
      id: resource.id,
      resourceType: resource.resourceType,
      externalId: resource.externalId,
      name: resource.name,
      metadata: parseJsonObject(resource.metadata),
      isEnabled: resource.isEnabled,
    })),
    permissions,
    recentActivity,
    healthChecks,
  };
}

export async function createTenantConnection(db: ScopedPrisma, ctx: TenantContext, input: {
  providerKey: string;
  connectionName: string;
  branchId?: string;
  credentials?: Record<string, unknown>;
  grantedScopes?: string[];
  configuration?: Record<string, unknown>;
}) {
  const provider = getIntegrationProviderDefinition(input.providerKey);
  if (provider.key !== "internal_test") {
    throw new IntegrationError("ACTION_NOT_ALLOWED", "Only the internal test provider can be connected at this stage.");
  }

  const encrypted = input.credentials
    ? JSON.stringify(await integrationCredentialVault.encrypt(input.credentials))
    : null;

  const created = await db.tenantIntegration.create({
    data: {
      organizationId: db.organizationId,
      branchId: input.branchId || null,
      providerKey: provider.key,
      connectionName: input.connectionName,
      status: "pending",
      healthStatus: "unknown",
      encryptedCredentials: encrypted,
      grantedScopes: JSON.stringify(input.grantedScopes || provider.capabilities),
      selectedResources: JSON.stringify([]),
      configuration: JSON.stringify(input.configuration || {}),
      fieldMappings: JSON.stringify([]),
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    },
  });

  await writeAuditLog(ctx, "CREATE_TENANT_INTEGRATION", "TenantIntegration", created.id, provider.key);
  return toTenantIntegrationRecord(created);
}

export async function updateTenantConnectionStatus(
  db: ScopedPrisma,
  ctx: TenantContext,
  input: { id: string; status: IntegrationConnectionStatus }
) {
  const current = await getTenantIntegrationOrThrow(db, input.id);
  assertIntegrationStatusTransition(current.status as IntegrationConnectionStatus, input.status);
  const updated = await db.tenantIntegration.update({
    where: { id: input.id },
    data: {
      status: input.status,
      updatedBy: ctx.userId,
    },
  });
  await writeAuditLog(ctx, "UPDATE_TENANT_INTEGRATION_STATUS", "TenantIntegration", input.id, input.status);
  return toTenantIntegrationRecord(updated);
}

export async function testTenantConnection(db: ScopedPrisma, ctx: TenantContext, id: string) {
  const execution = await buildExecutionContext(db, id, {
    requestSource: "user",
    userId: ctx.userId,
  });
  const adapter = getIntegrationProviderAdapter(execution.providerKey);
  if (!adapter) {
    throw new IntegrationError("ACTION_NOT_SUPPORTED", "No adapter is available for this provider.");
  }

  const result = await adapter.testConnection(execution);
  const health = evaluateIntegrationHealth({ integration: execution.integration, testResult: result });
  const updated = await db.tenantIntegration.update({
    where: { id },
    data: {
      status: result.success ? "connected" : "failed",
      healthStatus: health,
      externalAccountId: result.externalAccountId || null,
      externalAccountName: result.externalAccountName || null,
      grantedScopes: JSON.stringify(result.scopes),
      lastConnectedAt: result.success ? new Date() : execution.integration.lastConnectedAt,
      lastTestedAt: new Date(),
      lastSuccessfulAt: result.success ? new Date() : execution.integration.lastSuccessfulAt,
      failureCount: result.success ? 0 : execution.integration.failureCount + 1,
      updatedBy: ctx.userId,
    },
  });

  await db.integrationHealthCheck.create({
    data: {
      organizationId: db.organizationId,
      tenantIntegrationId: id,
      status: health,
      latencyMs: result.latencyMs || null,
      credentialStatus: result.success ? "valid" : "invalid",
      scopeStatus: result.scopes.length > 0 ? "granted" : "missing",
      checkedAt: new Date(),
    },
  });

  await writeAuditLog(ctx, "TEST_TENANT_INTEGRATION", "TenantIntegration", id, result.message);
  return {
    connection: toTenantIntegrationRecord(updated),
    result,
  };
}

export async function listIntegrationResources(db: ScopedPrisma, ctx: TenantContext, id: string) {
  const execution = await buildExecutionContext(db, id, {
    requestSource: "user",
    userId: ctx.userId,
  });
  const adapter = getIntegrationProviderAdapter(execution.providerKey);
  if (!adapter?.getResources) {
    return [];
  }

  const result = await adapter.getResources(execution, {});
  return result.items;
}

export async function saveIntegrationResources(
  db: ScopedPrisma,
  ctx: TenantContext,
  input: { id: string; resources: Array<{ resourceType: string; externalId: string; name: string; metadata?: Record<string, unknown> }> }
) {
  await getTenantIntegrationOrThrow(db, input.id);
  await db.integrationResource.deleteMany({ where: { tenantIntegrationId: input.id } });
  for (const resource of input.resources) {
    await db.integrationResource.create({
      data: {
        organizationId: db.organizationId,
        tenantIntegrationId: input.id,
        resourceType: resource.resourceType,
        externalId: resource.externalId,
        name: resource.name,
        metadata: JSON.stringify(resource.metadata || {}),
      },
    });
  }
  await db.tenantIntegration.update({
    where: { id: input.id },
    data: {
      selectedResources: JSON.stringify(
        input.resources.map((resource) => ({
          id: resource.externalId,
          name: resource.name,
          resourceType: resource.resourceType,
          ...resource.metadata,
        }))
      ),
      updatedBy: ctx.userId,
    },
  });
  await writeAuditLog(ctx, "SAVE_INTEGRATION_RESOURCES", "TenantIntegration", input.id, `${input.resources.length} resources`);
}

export async function saveIntegrationPermissions(
  db: ScopedPrisma,
  ctx: TenantContext,
  input: {
    id: string;
    permissions: Array<{
      subjectType: "tenant" | "role" | "user" | "voice_agent";
      subjectId: string;
      actionKey: string;
      effect: "allow" | "deny" | "approval_required";
      approvalMode?: string;
    }>;
  }
) {
  await getTenantIntegrationOrThrow(db, input.id);
  await db.integrationPermission.deleteMany({ where: { tenantIntegrationId: input.id } });
  for (const permission of input.permissions) {
    await db.integrationPermission.create({
      data: {
        organizationId: db.organizationId,
        tenantIntegrationId: input.id,
        subjectType: permission.subjectType,
        subjectId: permission.subjectId,
        actionKey: permission.actionKey,
        effect: permission.effect,
        approvalMode: permission.approvalMode || null,
      },
    });
  }
  await writeAuditLog(ctx, "SAVE_INTEGRATION_PERMISSIONS", "TenantIntegration", input.id, `${input.permissions.length} rules`);
}

export async function executeIntegrationAction(
  db: ScopedPrisma,
  ctx: TenantContext,
  input: { tenantIntegrationId: string; request: IntegrationActionRequest }
) {
  const execution = await buildExecutionContext(db, input.tenantIntegrationId, {
    requestSource: "user",
    userId: ctx.userId,
  });
  const action = getIntegrationActionDefinition(input.request.actionKey);
  if (!action) {
    throw new IntegrationError("ACTION_NOT_SUPPORTED", "Unsupported integration action.");
  }
  const provider = getIntegrationProviderDefinition(execution.providerKey);
  const adapter = getIntegrationProviderAdapter(execution.providerKey);
  if (!adapter?.executeAction) {
    throw new IntegrationError("ACTION_NOT_SUPPORTED", "This provider does not support action execution.");
  }

  action.inputSchema.parse(input.request.payload);
  const permissions = await db.integrationPermission.findMany({
    where: { tenantIntegrationId: input.tenantIntegrationId },
  });
  const org = await db.organization.findUnique({
    where: { id: db.organizationId },
    select: { industryProfileKey: true, industry: true },
  });
  const decision = evaluateIntegrationPermission({
    providerEnabled: provider.status !== "disabled",
    featureEnabled: true,
    planAllowed: true,
    requestSource: execution.requestSource,
    integration: execution.integration,
    action,
    industryProfileKey: resolveTenantIndustryProfileKey(org || {}),
    grantedScopes: execution.integration.grantedScopes,
    rules: permissions.map((rule) => ({
      subjectType: rule.subjectType as never,
      subjectId: rule.subjectId,
      actionKey: rule.actionKey,
      effect: rule.effect as never,
    })),
    role: ctx.role,
    userId: ctx.userId,
  });

  if (!decision.allowed) {
    throw new IntegrationError("ACTION_NOT_ALLOWED", decision.reasonCode || "This action is not allowed.", { statusCode: 403 });
  }

  if (decision.requiresApproval) {
    const approval = await db.integrationApprovalRequest.create({
      data: {
        organizationId: db.organizationId,
        tenantIntegrationId: input.tenantIntegrationId,
        actionKey: action.key,
        requestSource: execution.requestSource,
        requestedBy: ctx.userId,
        callId: execution.callId || null,
        voiceAgentId: execution.voiceAgentId || null,
        payload: JSON.stringify(integrationCredentialVault.redact(input.request.payload)),
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60_000),
      },
    });
    return {
      success: true,
      status: "approval_required",
      actionKey: action.key,
      message: "Approval is required before this action can run.",
      approvalRequestId: approval.id,
    };
  }

  const requestHash = createIntegrationRequestHash({
    providerKey: execution.providerKey,
    actionKey: action.key,
    resourceId: input.request.resourceId,
    payload: input.request.payload,
  });
  const redactedRequest = integrationCredentialVault.redact(input.request.payload);
  const idempotencyStore = {
    findByIdempotencyKey: async (idempotencyKey: string) => {
      const existing = await (db as any).integrationActionExecution.findUnique({
        where: {
          organizationId_tenantIntegrationId_idempotencyKey: {
            organizationId: db.organizationId,
            tenantIntegrationId: input.tenantIntegrationId,
            idempotencyKey,
          },
        },
      });
      if (!existing) return null;
      return {
        idempotencyKey: existing.idempotencyKey,
        requestHash: existing.requestHash,
        status: existing.status,
        safeResultRedacted: existing.safeResultRedacted ? parseJsonObject(existing.safeResultRedacted) : null,
        errorCode: existing.errorCode,
        expiresAt: existing.expiresAt,
      };
    },
    createRunning: async (record: any) => {
      await (db as any).integrationActionExecution.create({
        data: {
          organizationId: db.organizationId,
          tenantIntegrationId: input.tenantIntegrationId,
          providerKey: execution.providerKey,
          actionKey: action.key,
          idempotencyKey: record.idempotencyKey,
          requestHash: record.requestHash,
          correlationId: execution.correlationId,
          requestSource: execution.requestSource,
          userId: ctx.userId,
          voiceAgentId: execution.voiceAgentId || null,
          callId: execution.callId || null,
          status: "running",
          expiresAt: record.expiresAt || null,
        },
      });
    },
    restartFailed: async (record: any) => {
      await (db as any).integrationActionExecution.update({
        where: {
          organizationId_tenantIntegrationId_idempotencyKey: {
            organizationId: db.organizationId,
            tenantIntegrationId: input.tenantIntegrationId,
            idempotencyKey: record.idempotencyKey,
          },
        },
        data: {
          requestHash: record.requestHash,
          correlationId: execution.correlationId,
          requestSource: execution.requestSource,
          userId: ctx.userId,
          voiceAgentId: execution.voiceAgentId || null,
          callId: execution.callId || null,
          status: "running",
          errorCode: null,
          failedAt: null,
          completedAt: null,
          safeResultRedacted: null,
          expiresAt: record.expiresAt || null,
        },
      });
    },
    markCompleted: async (idempotencyKey: string, safeResultRedacted: Record<string, unknown> | null) => {
      await (db as any).integrationActionExecution.update({
        where: {
          organizationId_tenantIntegrationId_idempotencyKey: {
            organizationId: db.organizationId,
            tenantIntegrationId: input.tenantIntegrationId,
            idempotencyKey,
          },
        },
        data: {
          status: "completed",
          safeResultRedacted: JSON.stringify(safeResultRedacted || {}),
          completedAt: new Date(),
        },
      });
    },
    markFailed: async (idempotencyKey: string, errorCode?: string | null) => {
      await (db as any).integrationActionExecution.update({
        where: {
          organizationId_tenantIntegrationId_idempotencyKey: {
            organizationId: db.organizationId,
            tenantIntegrationId: input.tenantIntegrationId,
            idempotencyKey,
          },
        },
        data: {
          status: "failed",
          errorCode: errorCode || null,
          failedAt: new Date(),
        },
      });
    },
  };

  if (action.idempotencyRequired) {
    if (!input.request.idempotencyKey) {
      throw new IntegrationError("VALIDATION_FAILED", "This integration action requires an idempotency key.", {
        statusCode: 400,
      });
    }

    const idempotencyDecision = await beginIdempotentExecution(idempotencyStore, {
      idempotencyKey: input.request.idempotencyKey,
      requestHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
    });

    if (idempotencyDecision.replay) {
      return {
        success: true,
        status: "completed" as const,
        actionKey: action.key,
        message: "Previously completed integration action reused safely.",
        data: idempotencyDecision.safeResultRedacted || {},
      };
    }
  }

  await enforceRateLimit(
    {
      increment: async (rateInput) => {
        const counter = await (db as any).integrationRateLimitCounter.upsert({
          where: {
            organizationId_bucketKey: {
              organizationId: db.organizationId,
              bucketKey: rateInput.bucketKey,
            },
          },
          create: {
            organizationId: db.organizationId,
            tenantIntegrationId: input.tenantIntegrationId,
            providerKey: execution.providerKey,
            actionKey: action.key,
            bucketKey: rateInput.bucketKey,
            windowStartedAt: rateInput.windowStartedAt,
            windowEndsAt: rateInput.windowEndsAt,
            count: 1,
          },
          update: {
            count: { increment: 1 },
            windowEndsAt: rateInput.windowEndsAt,
          },
        });
        return counter;
      },
    },
    {
      organizationId: db.organizationId,
      providerKey: execution.providerKey,
      tenantIntegrationId: input.tenantIntegrationId,
      actionKey: action.key,
    }
  );

  const startedAt = Date.now();
  try {
    const result = await adapter.executeAction(execution, input.request);
    action.outputSchema.safeParse(result.data || {});

    const redactedResponse = integrationCredentialVault.redact(result.data || {}) as Record<string, unknown>;

    await db.integrationActionLog.create({
      data: {
        organizationId: db.organizationId,
        tenantIntegrationId: input.tenantIntegrationId,
        providerKey: execution.providerKey,
        actionKey: action.key,
        requestSource: execution.requestSource,
        userId: ctx.userId,
        voiceAgentId: execution.voiceAgentId || null,
        callId: execution.callId || null,
        correlationId: execution.correlationId,
        requestPayloadRedacted: JSON.stringify(redactedRequest),
        responsePayloadRedacted: JSON.stringify(redactedResponse),
        status: result.status,
        errorCode: result.errorCode || null,
        durationMs: Date.now() - startedAt,
      },
    });

    await db.integrationUsageRecord.create({
      data: {
        organizationId: db.organizationId,
        tenantIntegrationId: input.tenantIntegrationId,
        providerKey: execution.providerKey,
        metric: `action:${action.key}`,
        quantity: 1,
        periodKey: periodKey(),
      },
    });

    await db.tenantIntegration.update({
      where: { id: input.tenantIntegrationId },
      data: {
        lastSuccessfulAt: result.success ? new Date() : execution.integration.lastSuccessfulAt,
        healthStatus: result.success ? "healthy" : "degraded",
        failureCount: result.success ? 0 : execution.integration.failureCount + 1,
        updatedBy: ctx.userId,
      },
    });

    if (action.idempotencyRequired && input.request.idempotencyKey) {
      await idempotencyStore.markCompleted(input.request.idempotencyKey, redactedResponse);
    }

    await writeAuditLog(ctx, "EXECUTE_INTEGRATION_ACTION", "TenantIntegration", input.tenantIntegrationId, action.key);
    return result;
  } catch (error) {
    if (action.idempotencyRequired && input.request.idempotencyKey) {
      const safe = toSafeIntegrationError(error);
      await idempotencyStore.markFailed(input.request.idempotencyKey, safe.code);
    }
    throw error;
  }
}

export async function approveIntegrationAction(
  db: ScopedPrisma,
  ctx: TenantContext,
  input: { approvalRequestId: string; approve: boolean }
) {
  const approval = await db.integrationApprovalRequest.findUnique({
    where: { id: input.approvalRequestId },
  });
  if (!approval) {
    throw new IntegrationError("INTEGRATION_NOT_FOUND", "Approval request not found.", { statusCode: 404 });
  }

  if (approval.organizationId !== db.organizationId) {
    throw new IntegrationError("ACTION_NOT_ALLOWED", "You cannot approve another tenant's request.", { statusCode: 403 });
  }

  const updated = await db.integrationApprovalRequest.update({
    where: { id: input.approvalRequestId },
    data: input.approve
      ? { status: "approved", approvedBy: ctx.userId, approvedAt: new Date() }
      : { status: "rejected", rejectedBy: ctx.userId, rejectedAt: new Date() },
  });

  await writeAuditLog(ctx, input.approve ? "APPROVE_INTEGRATION_ACTION" : "REJECT_INTEGRATION_ACTION", "IntegrationApprovalRequest", updated.id, updated.actionKey);
  return updated;
}

export async function listIntegrationApprovals(db: ScopedPrisma) {
  return db.integrationApprovalRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function listConnectionActivity(db: ScopedPrisma, id: string) {
  await getTenantIntegrationOrThrow(db, id);
  return db.integrationActionLog.findMany({
    where: { tenantIntegrationId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getConnectionHealth(db: ScopedPrisma, id: string) {
  const integration = await getTenantIntegrationOrThrow(db, id);
  const checks = await db.integrationHealthCheck.findMany({
    where: { tenantIntegrationId: id },
    orderBy: { checkedAt: "desc" },
    take: 20,
  });
  return {
    connectionId: id,
    status: integration.healthStatus,
    checks,
  };
}

export async function createIntegrationOAuthRequest(input: {
  tenantId: string;
  userId: string;
  providerKey: string;
  redirectPath: string;
}) {
  return createOAuthState(prismaOAuthStateStore, input);
}

export async function consumeIntegrationOAuthState(input: {
  tenantId: string;
  userId: string;
  providerKey: string;
  state: string;
}) {
  return validateOAuthState(prismaOAuthStateStore, input);
}

export async function listPermittedVoiceTools(db: ScopedPrisma) {
  const org = await db.organization.findUnique({
    where: { id: db.organizationId },
    select: { industryProfileKey: true, industry: true },
  });
  const integrations = (await listTenantConnections(db)).filter((integration) => integration.status !== "disabled");
  const permissions = await db.integrationPermission.findMany({
    where: {
      tenantIntegrationId: { in: integrations.map((integration) => integration.id) },
    },
  });
  const permissionsByIntegrationId = permissions.reduce<Record<string, typeof permissions>>((acc, permission) => {
    acc[permission.tenantIntegrationId] ||= [];
    acc[permission.tenantIntegrationId].push(permission);
    return acc;
  }, {});

  return getAvailableVoiceTools({
    tenantId: db.organizationId,
    voiceAgentId: "voice-agent-preview",
    callId: "voice-call-preview",
    industryProfileKey: resolveTenantIndustryProfileKey(org || {}),
    integrations,
    permissionsByIntegrationId: permissionsByIntegrationId as never,
  });
}

