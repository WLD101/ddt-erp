"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext } from "@/lib/tenant";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { createOpaqueToken, hashToken } from "@/lib/security/tokens";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const exportScopeSchema = z.enum([
  "leads",
  "tenant_summary",
  "customers",
  "suppliers",
  "products",
  "inventory",
  "sales",
  "purchases",
  "quotations",
  "full",
]);

export async function requestExportAction(scope: unknown) {
  const ctx = await getCurrentTenantContext();
  const parsed = exportScopeSchema.safeParse(scope);
  if (!parsed.success) return { error: "Invalid export scope." };

  const request = await prisma.exportRequest.create({
    data: {
      organizationId: ctx.organizationId,
      requestedById: ctx.userId,
      scope: parsed.data,
      status: "PENDING",
    },
  });
  await writePlatformAuditLog({
    actorId: ctx.userId,
    action: "EXPORT_REQUESTED",
    entityType: "ExportRequest",
    entityId: request.id,
    details: `Tenant requested ${parsed.data} export.`,
  });
  return { success: true, data: request };
}

export async function getPlatformExportRequests() {
  await requirePlatformAdmin();
  return prisma.exportRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true, city: true, country: true } },
      requestedBy: { select: { name: true, email: true, phone: true } },
      approvedBy: { select: { name: true, email: true } },
    },
  });
}

export async function approveExportRequestAction(id: string) {
  const session = await requirePlatformAdmin();
  const { token, tokenHash } = createOpaqueToken();
  const now = new Date();
  const request = await prisma.exportRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: session.user.id,
      approvedAt: now,
      generatedAt: now,
      downloadTokenHash: tokenHash,
      downloadExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });
  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "EXPORT_APPROVED",
    entityType: "ExportRequest",
    entityId: request.id,
    details: `Approved ${request.scope} export.`,
  });
  revalidatePath("/platform/exports");
  return { success: true, token };
}

export async function rejectExportRequestAction(id: string) {
  const session = await requirePlatformAdmin();
  const request = await prisma.exportRequest.update({
    where: { id },
    data: { status: "REJECTED", approvedById: session.user.id, approvedAt: new Date() },
  });
  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "EXPORT_REJECTED",
    entityType: "ExportRequest",
    entityId: request.id,
  });
  revalidatePath("/platform/exports");
  return { success: true };
}

export async function consumeApprovedExportToken(token: string) {
  const request = await prisma.exportRequest.findFirst({
    where: {
      downloadTokenHash: hashToken(token),
      status: { in: ["APPROVED", "GENERATED"] },
      downloadExpiresAt: { gt: new Date() },
    },
    include: {
      organization: { include: { subscription: true, organizationPackage: { include: { package: true } } } },
      requestedBy: true,
    },
  });
  if (!request) return null;
  await prisma.exportRequest.update({
    where: { id: request.id },
    data: { status: "DOWNLOADED" },
  });
  return request;
}
