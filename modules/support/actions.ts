"use server";

import { revalidatePath } from "next/cache";

import { createServerAction } from "@/lib/actions/builder";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { liveSupportSchema, supportTicketSchema, updateSupportRequestSchema } from "@/modules/support/schema";

export const submitSupportTicket = createServerAction({
  label: "Submit Support Ticket",
  schema: supportTicketSchema,
  enforceBilling: false,
  revalidatePaths: ["/dashboard/support", "/platform/support"],
  handler: async ({ input, context }) => {
    const request = await prisma.supportRequest.create({
      data: {
        organizationId: context.orgId,
        requestedById: context.ctx.userId,
        type: "TICKET",
        priority: input.priority,
        reason: input.reason,
        subject: input.subject,
        description: input.description,
        sourcePage: input.sourcePage || null,
        contactName: input.contactName || null,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone || null,
      },
    });

    await writeAuditLog(
      context.ctx,
      "SUPPORT_TICKET_OPENED",
      "SupportRequest",
      request.id,
      `[${input.reason}] ${input.subject}`,
    );

    return request;
  },
});

export const requestLiveSupport = createServerAction({
  label: "Request Live Support",
  schema: liveSupportSchema,
  enforceBilling: false,
  revalidatePaths: ["/platform/support"],
  handler: async ({ input, context }) => {
    const request = await prisma.supportRequest.create({
      data: {
        organizationId: context.orgId,
        requestedById: context.ctx.userId,
        type: "LIVE_SUPPORT",
        priority: "HIGH",
        reason: "human_support",
        subject: "Tenant requested live human support",
        description:
          input.message?.trim() ||
          "Tenant requested to talk to a human support operator from the floating support launcher.",
        sourcePage: input.sourcePage || null,
      },
    });

    await writeAuditLog(
      context.ctx,
      "LIVE_SUPPORT_REQUESTED",
      "SupportRequest",
      request.id,
      request.description,
    );

    return request;
  },
});

export async function getPlatformSupportRequests() {
  await requirePlatformAdmin();

  return prisma.supportRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          tenantType: true,
          lifecycleStatus: true,
        },
      },
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

export async function updateSupportRequestStatus(formData: FormData) {
  await requirePlatformAdmin();
  const parsed = updateSupportRequestSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  await prisma.supportRequest.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes || null,
      resolvedAt: ["RESOLVED", "CLOSED"].includes(parsed.data.status) ? new Date() : null,
    },
  });

  revalidatePath("/platform/support");
}
