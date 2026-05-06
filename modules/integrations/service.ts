import { Prisma } from "@prisma/client";
import { z } from "zod";

import { ScopedPrisma } from "@/lib/db/client";
import {
  decryptIntegrationCredentials,
  encryptIntegrationCredentials,
  getChannelAdapter,
  SALES_CHANNEL_TYPES,
  summarizeCredentialKeys,
  type IntegrationConfiguration,
  type IntegrationCredentials,
  type SalesChannelEntityType,
  type SalesChannelLogDirection,
  type SalesChannelType,
  type SyncResult,
} from "@/lib/integrations";

const configValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const connectChannelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Channel name is required"),
  type: z.enum(SALES_CHANNEL_TYPES),
  isActive: z.boolean().default(true),
  credentials: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  configuration: z.record(z.string(), configValueSchema).default({}),
});

export const channelIdSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
});

type ConnectChannelInput = z.infer<typeof connectChannelSchema>;

function filterCredentialPayload(credentials: IntegrationCredentials) {
  return Object.fromEntries(
    Object.entries(credentials).filter(([, value]) => {
      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      return value !== null && value !== undefined;
    })
  ) as IntegrationCredentials;
}

function parseConfiguration(configuration: string | null | undefined): IntegrationConfiguration {
  if (!configuration) {
    return {};
  }

  try {
    return JSON.parse(configuration) as IntegrationConfiguration;
  } catch {
    return {};
  }
}

function isMockConfiguration(configuration: IntegrationConfiguration) {
  return configuration.useMock === true;
}

function sanitizeSyncError(channelType: SalesChannelType, error: string | null) {
  if (!error) {
    return null;
  }

  switch (channelType) {
    case "DARAZ":
      if (/category/i.test(error) || /attribute/i.test(error)) {
        return "Daraz category mapping required before publishing";
      }
      return "Daraz needs attention before the next sync.";
    case "SHOPIFY":
      if (/inventory/i.test(error)) {
        return "Shopify inventory sync needs review.";
      }
      return "Shopify sync needs attention before the next run.";
    case "WOOCOMMERCE":
      if (/permission/i.test(error) || /key/i.test(error)) {
        return "WooCommerce connection needs attention before the next sync.";
      }
      return "WooCommerce sync needs attention before the next run.";
    case "CSV":
      return "CSV import completed with warnings";
    default:
      return "Channel sync needs attention.";
  }
}

function deriveConnectionState(
  type: SalesChannelType,
  configuration: IntegrationConfiguration,
  hasCredentials: boolean
) {
  if (isMockConfiguration(configuration)) {
    return "DEMO";
  }

  if (type !== "CSV" && !hasCredentials) {
    return "NOT_CONNECTED";
  }

  return "CONNECTED";
}

function buildFriendlySyncMessage(
  type: SalesChannelType,
  syncStatus: string,
  connectionState: "DEMO" | "CONNECTED" | "NOT_CONNECTED"
) {
  if (connectionState === "NOT_CONNECTED") {
    return "Not connected yet";
  }

  if (connectionState === "DEMO") {
    switch (type) {
      case "DARAZ":
        return "Daraz demo mode is active";
      case "SHOPIFY":
        return "Shopify demo data is active";
      case "WOOCOMMERCE":
        return "WooCommerce demo data is active";
      case "CSV":
        return "CSV import preview mode";
    }
  }

  if (syncStatus === "SUCCESS") {
    switch (type) {
      case "DARAZ":
        return "Daraz connection verified successfully";
      case "SHOPIFY":
        return "Shopify inventory sync completed";
      case "WOOCOMMERCE":
        return "WooCommerce keys verified successfully";
      case "CSV":
        return "CSV import completed";
    }
  }

  if (syncStatus === "FAILED") {
    return "Needs attention";
  }

  if (syncStatus === "SYNCING" || syncStatus === "CONNECTING") {
    return "Sync in progress";
  }

  return "Ready for sync";
}

function sanitizeLogMessage(type: SalesChannelType, message: string, status: string) {
  if (status !== "FAILED") {
    return message;
  }

  return sanitizeSyncError(type, message) ?? message;
}

function normalizeChannelType(value: string): SalesChannelType {
  if (!SALES_CHANNEL_TYPES.includes(value as SalesChannelType)) {
    throw new Error(`Unsupported sales channel type: ${value}`);
  }

  return value as SalesChannelType;
}

function serializeChannel(
  channel: any,
  totalProducts: number
) {
  const credentials = decryptIntegrationCredentials(channel.credentialsEncrypted);
  const configuration = parseConfiguration(channel.configuration);
  const hasCredentials = Object.keys(credentials).length > 0;
  const type = normalizeChannelType(channel.type);
  const connectionState = deriveConnectionState(type, configuration, hasCredentials);
  const productMaps = channel._count?.productMaps ?? 0;
  const orderMaps = channel._count?.orderMaps ?? 0;
  const unmappedProducts = Math.max(totalProducts - productMaps, 0);
  const warnings: string[] = [];

  if (type === "DARAZ" && unmappedProducts > 0) {
    warnings.push("Daraz category mapping required before publishing");
  } else if ((type === "SHOPIFY" || type === "WOOCOMMERCE") && unmappedProducts > 0) {
    warnings.push(
      `${unmappedProducts} product${unmappedProducts === 1 ? "" : "s"} still need mapping before inventory can be pushed`
    );
  }

  if (type === "DARAZ" && connectionState === "DEMO" && !hasCredentials) {
    warnings.push("Mock mode is active because real Daraz credentials are not configured");
  }

  return {
    id: channel.id,
    organizationId: channel.organizationId,
    name: channel.name,
    type,
    isActive: channel.isActive,
    syncStatus: channel.syncStatus,
    syncError: sanitizeSyncError(type, channel.syncError),
    lastSyncAt: channel.lastSyncAt,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
    configuration,
    credentialKeys: summarizeCredentialKeys(credentials),
    hasCredentials,
    connectionState,
    statusLabel:
      connectionState === "DEMO"
        ? "Demo"
        : connectionState === "CONNECTED"
          ? "Connected"
          : "Not connected",
    syncMessage: buildFriendlySyncMessage(type, channel.syncStatus, connectionState),
    warnings,
    counts: {
      productMaps,
      orderMaps,
      syncLogs: channel._count?.syncLogs ?? 0,
      totalProducts,
      unmappedProducts,
    },
  };
}

async function createSyncLog(
  db: ScopedPrisma,
  channelId: string,
  direction: SalesChannelLogDirection,
  entityType: SalesChannelEntityType,
  status: "PENDING" | "SUCCESS" | "FAILED",
  message: string,
  metadata?: Record<string, unknown>
) {
  return db.salesChannelSyncLog.create({
    data: {
      organizationId: db.organizationId,
      salesChannelId: channelId,
      direction,
      entityType,
      status,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
      finishedAt: status === "PENDING" ? null : new Date(),
    },
  });
}

async function markChannelState(
  db: ScopedPrisma,
  channelId: string,
  data: Prisma.SalesChannelUncheckedUpdateInput
) {
  return db.salesChannel.update({
    where: { id: channelId },
    data,
  });
}

async function loadChannelContext(db: ScopedPrisma, channelId: string) {
  const channel = await db.salesChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel) {
    throw new Error("Sales channel not found in your organization.");
  }

  const type = normalizeChannelType(channel.type);
  const configuration = parseConfiguration(channel.configuration);
  const credentials = decryptIntegrationCredentials(channel.credentialsEncrypted);

  return {
    adapter: getChannelAdapter(type),
    channel,
    context: {
      db,
      channel: {
        id: channel.id,
        organizationId: channel.organizationId,
        name: channel.name,
        type,
        isActive: channel.isActive,
        lastSyncAt: channel.lastSyncAt,
        syncStatus: channel.syncStatus,
        syncError: channel.syncError,
        configuration,
      },
      configuration,
      credentials,
    },
  };
}

async function runChannelOperation(
  db: ScopedPrisma,
  channelId: string,
  entityType: SalesChannelEntityType,
  direction: SalesChannelLogDirection,
  executor: (context: Awaited<ReturnType<typeof loadChannelContext>>["context"]) => Promise<SyncResult>
) {
  const { context } = await loadChannelContext(db, channelId);

  await markChannelState(db, channelId, {
    syncStatus: "SYNCING",
    syncError: null,
  });

  await createSyncLog(db, channelId, direction, entityType, "PENDING", `${entityType} sync started.`);

  try {
    const result = await executor(context);
    const safeError = result.errors[0]
      ? sanitizeSyncError(context.channel.type, result.errors[0])
      : null;
    const safeMessage = result.success
      ? result.message
      : sanitizeLogMessage(context.channel.type, result.message, "FAILED");

    await markChannelState(db, channelId, {
      syncStatus: result.success ? "SUCCESS" : "FAILED",
      syncError: safeError,
      lastSyncAt: new Date(),
    });

    await createSyncLog(
      db,
      channelId,
      direction,
      entityType,
      result.success ? "SUCCESS" : "FAILED",
      safeMessage,
      {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: safeError ? [safeError] : result.errors,
      }
    );

    return {
      ...result,
      message: safeMessage,
      errors: safeError ? [safeError] : result.errors,
    };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown integration error";
    const message = sanitizeSyncError(context.channel.type, rawMessage) ?? "Integration sync needs attention.";

    await markChannelState(db, channelId, {
      syncStatus: "FAILED",
      syncError: message,
    });

    await createSyncLog(db, channelId, direction, entityType, "FAILED", message);
    throw new Error(message);
  }
}

export async function getSalesChannels(db: ScopedPrisma) {
  const [channels, totalProducts] = await Promise.all([
    db.salesChannel.findMany({
      orderBy: { createdAt: "desc" },
    }),
    db.product.count(),
  ]);

  return channels.map((channel) => serializeChannel(channel, totalProducts));
}

export async function getSalesChannelById(db: ScopedPrisma, id: string) {
  const [channel, totalProducts] = await Promise.all([
    db.salesChannel.findUnique({
      where: { id },
    }),
    db.product.count(),
  ]);

  if (!channel) {
    throw new Error("Sales channel not found in your organization.");
  }

  return serializeChannel(channel, totalProducts);
}

export async function connectChannel(db: ScopedPrisma, input: ConnectChannelInput) {
  const existing = input.id
    ? await db.salesChannel.findUnique({ where: { id: input.id } })
    : null;

  const existingCredentials = decryptIntegrationCredentials(existing?.credentialsEncrypted);
  const incomingCredentials = filterCredentialPayload(input.credentials);
  const nextCredentials: IntegrationCredentials =
    Object.keys(incomingCredentials).length > 0
      ? { ...existingCredentials, ...incomingCredentials }
      : existingCredentials;

  const nextConfiguration = {
    ...parseConfiguration(existing?.configuration),
    ...input.configuration,
  };

  const payload: Prisma.SalesChannelUncheckedCreateInput | Prisma.SalesChannelUncheckedUpdateInput = {
    name: input.name,
    type: input.type,
    isActive: input.isActive,
    configuration: JSON.stringify(nextConfiguration),
    credentialsEncrypted:
      Object.keys(nextCredentials).length > 0 ? encryptIntegrationCredentials(nextCredentials) : null,
    syncStatus: "CONNECTING",
    syncError: null,
  };

  const channel = existing
    ? await db.salesChannel.update({
        where: { id: existing.id },
        data: payload as Prisma.SalesChannelUncheckedUpdateInput,
      })
    : await db.salesChannel.create({
        data: payload as Prisma.SalesChannelUncheckedCreateInput,
      });

  const { adapter, context } = await loadChannelContext(db, channel.id);
  const connection = await adapter.connectChannel(context);
  const safeConnectionMessage = connection.success
    ? connection.message
    : sanitizeLogMessage(context.channel.type, connection.message, "FAILED");

  await markChannelState(db, channel.id, {
    syncStatus: connection.success ? "SUCCESS" : "FAILED",
    syncError: connection.success ? null : safeConnectionMessage,
    lastSyncAt: connection.success ? new Date() : null,
  });

  await createSyncLog(
    db,
    channel.id,
    "INBOUND",
    "CONNECTION",
    connection.success ? "SUCCESS" : "FAILED",
    safeConnectionMessage,
    { details: connection.details ?? [] }
  );

  const fresh = await db.salesChannel.findUnique({
    where: { id: channel.id },
  });

  if (!fresh) {
    throw new Error("Connected channel could not be reloaded.");
  }

  const totalProducts = await db.product.count();

  return {
    channel: serializeChannel(fresh, totalProducts),
    connection: {
      ...connection,
      message: safeConnectionMessage,
    },
  };
}

export async function testChannelConnection(db: ScopedPrisma, channelId: string) {
  const { adapter, context, channel } = await loadChannelContext(db, channelId);
  const result = await adapter.testConnection(context);
  const safeMessage = result.success
    ? result.message
    : sanitizeLogMessage(context.channel.type, result.message, "FAILED");

  await markChannelState(db, channel.id, {
    syncStatus: result.success ? "SUCCESS" : "FAILED",
    syncError: result.success ? null : safeMessage,
    lastSyncAt: result.success ? new Date() : channel.lastSyncAt,
  });

  await createSyncLog(
    db,
    channelId,
    "INBOUND",
    "CONNECTION",
    result.success ? "SUCCESS" : "FAILED",
    safeMessage,
    { details: result.details ?? [] }
  );

  return {
    ...result,
    message: safeMessage,
  };
}

export async function syncProducts(db: ScopedPrisma, channelId: string) {
  return runChannelOperation(db, channelId, "PRODUCTS", "INBOUND", async (context) => {
    return context.channel.isActive
      ? context.db.organizationId
        ? getChannelAdapter(context.channel.type).syncProducts(context)
        : Promise.reject(new Error("Channel is missing organization scope."))
      : Promise.resolve({
          success: false,
          message: "Channel is inactive. Activate it before syncing products.",
          created: 0,
          updated: 0,
          skipped: 0,
          errors: ["Channel is inactive."],
          logs: [],
        });
  });
}

export async function syncOrders(db: ScopedPrisma, channelId: string) {
  return runChannelOperation(db, channelId, "ORDERS", "INBOUND", async (context) => {
    return context.channel.isActive
      ? getChannelAdapter(context.channel.type).syncOrders(context)
      : Promise.resolve({
          success: false,
          message: "Channel is inactive. Activate it before syncing orders.",
          created: 0,
          updated: 0,
          skipped: 0,
          errors: ["Channel is inactive."],
          logs: [],
        });
  });
}

export async function pushInventory(db: ScopedPrisma, channelId: string) {
  return runChannelOperation(db, channelId, "INVENTORY", "OUTBOUND", async (context) => {
    return context.channel.isActive
      ? getChannelAdapter(context.channel.type).pushInventory(context)
      : Promise.resolve({
          success: false,
          message: "Channel is inactive. Activate it before pushing inventory.",
          created: 0,
          updated: 0,
          skipped: 0,
          errors: ["Channel is inactive."],
          logs: [],
        });
  });
}

export async function getSyncLogs(db: ScopedPrisma, channelId: string) {
  const { adapter, context } = await loadChannelContext(db, channelId);
  const [databaseLogs, adapterLogs] = await Promise.all([
    db.salesChannelSyncLog.findMany({
      where: { salesChannelId: channelId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    adapter.getSyncLogs(context),
  ]);

  return {
    adapterLogs: adapterLogs.map((log) => ({
      ...log,
      message: sanitizeLogMessage(context.channel.type, log.message, log.status),
    })),
    databaseLogs: databaseLogs.map((log) => ({
      id: log.id,
      direction: log.direction,
      entityType: log.entityType,
      status: log.status,
      message: sanitizeLogMessage(context.channel.type, log.message ?? "", log.status ?? ""),
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      startedAt: log.startedAt,
      finishedAt: log.finishedAt,
      createdAt: log.createdAt,
    })),
  };
}
