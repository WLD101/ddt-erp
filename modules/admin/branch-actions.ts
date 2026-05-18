/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createServerAction } from "@/lib/actions/builder";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { branchSchema, userBranchAssignmentSchema } from "./branch-schemas";
// branchSchema is imported from branch-schemas.ts and should be used locally or re-exported from a non-"use server" file if needed.
// Next.js "use server" files can only export async functions.


/**
 * ACTION: CREATE BRANCH
 */
export const createBranch = createServerAction({
  label: "CreateBranch",
  roles: ["owner", "admin"],
  planGate: { limit: "maxBranches" },
  schema: branchSchema,
  revalidatePaths: ["/settings/branches"],
  audit: {
    action: "CREATE_BRANCH",
    entityType: "Branch",
    getEntityId: (res) => res.id,
  },
  handler: async ({ input: data, context: ctx }) => {
    // If setting as main, unset other main branches for this org
    if (data.isMain) {
      await prisma.branch.updateMany({
        where: { organizationId: ctx.organizationId, isMain: true },
        data: { isMain: false },
      });
    }

    return prisma.branch.create({
      data: {
        ...data,
        organizationId: ctx.organizationId,
      },
    });
  },
});

/**
 * ACTION: SET ACTIVE BRANCH (CLIENT PREFERENCE)
 */
export async function setActiveBranch(branchId: string) {
  const { getCurrentTenantContext } = await import("@/lib/tenant");
  const ctx = await getCurrentTenantContext();
  const branch = await prisma.branch.findUnique({
    where: { id_organizationId: { id: branchId, organizationId: ctx.organizationId } },
    select: { id: true },
  });

  if (!branch) {
    throw new Error("Branch not found or access denied.");
  }

  const cookieStore = await cookies();
  cookieStore.set("x-active-branch", branchId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: true,
    sameSite: "lax",
  });
  
  revalidatePath("/", "layout");
}

/**
 * FETCH ALL BRANCHES
 */
export async function getBranches() {
  const { getCurrentTenantContext } = await import("@/lib/tenant");
  const ctx = await getCurrentTenantContext();

  return prisma.branch.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { name: "asc" },
  });
}

/**
 * DELETE BRANCH
 */
export const deleteBranch = createServerAction({
  label: "DeleteBranch",
  blockInDemoMode: true,
  roles: ["owner", "admin"],
  schema: z.string(),
  revalidatePaths: ["/settings/branches"],
  audit: {
    action: "DELETE_BRANCH",
    entityType: "Branch",
    getEntityId: (id) => id,
  },
  handler: async ({ input: id, context: ctx }) => {
    // Cannot delete the last branch or the current active main branch if needed
    const branch = await prisma.branch.findUnique({
      where: { id_organizationId: { id, organizationId: ctx.organizationId } },
    });

    if (branch?.isMain) {
      throw new Error("Cannot delete the Main branch. Assign a different Main branch first.");
    }

    return prisma.branch.delete({
      where: { id_organizationId: { id, organizationId: ctx.organizationId } },
    });
  },
});

/**
 * ACTION: ASSIGN USER TO BRANCH
 */
export const assignUserToBranch = createServerAction({
  label: "AssignUserToBranch",
  roles: ["owner", "admin"],
  schema: userBranchAssignmentSchema,
  revalidatePaths: ["/settings/branches"],
  audit: {
    action: "ASSIGN_USER_BRANCH",
    entityType: "OrganizationUser",
    getEntityId: (data) => data.membershipId,
  },
  handler: async ({ input: data, context: ctx }) => {
    const [membership, branch] = await Promise.all([
      prisma.organizationUser.findFirst({
        where: { id: data.membershipId, organizationId: ctx.organizationId },
        select: { id: true },
      }),
      prisma.branch.findUnique({
        where: { id_organizationId: { id: data.branchId, organizationId: ctx.organizationId } },
        select: { id: true },
      }),
    ]);

    if (!membership || !branch) {
      throw new Error("Membership or branch not found.");
    }

    return prisma.organizationUser.update({
      where: { 
        id: data.membershipId,
        organizationId: ctx.organizationId 
      },
      data: {
        assignedBranchId: data.branchId,
      },
    });
  },
});

/**
 * FETCH TEAM MEMBERS
 */
export async function getTeamMembers() {
  const { getCurrentTenantContext } = await import("@/lib/tenant");
  const ctx = await getCurrentTenantContext();

  return prisma.organizationUser.findMany({
    where: { organizationId: ctx.organizationId },
    include: {
      user: { select: { name: true, email: true } },
      role: true,
      assignedBranch: true,
    },
    orderBy: { user: { name: "asc" } },
  });
}
