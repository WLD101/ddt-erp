import { ScopedPrisma } from "@/lib/db/client";

export interface AuditLogFilterOptions {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * SERVICE: FETCH AUDIT LOGS
 * Scoped automatically by the provided db instance.
 */
export async function getAuditLogs(db: ScopedPrisma, options: AuditLogFilterOptions = {}) {
  const {
    userId,
    action,
    entityType,
    startDate,
    endDate,
    search,
    page = 1,
    pageSize = 20,
  } = options;

  const skip = (page - 1) * pageSize;

  const where: any = {}; // organizationId is handled by ScopedPrisma extension

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { details: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * SERVICE: FETCH METADATA FOR FILTERS
 */
export async function getAuditMetadata(db: ScopedPrisma) {
  // Logic to find users in the current org
  // We need to reach into memberships, but memberships is a TENANT_MODEL
  // so it will be filtered by organizationId: db.organizationId implicitly.

  const [users, entityTypes, actions] = await Promise.all([
    db.user.findMany({
      where: {
        memberships: {
          some: {} // organizationId is injected here by the extension
        }
      },
      select: { id: true, name: true }
    }),
    db.auditLog.groupBy({
      by: ["entityType"],
    }),
    db.auditLog.groupBy({
      by: ["action"],
    }),
  ]);

  return {
    users,
    entityTypes: entityTypes.map(e => e.entityType),
    actions: actions.map(a => a.action),
  };
}
