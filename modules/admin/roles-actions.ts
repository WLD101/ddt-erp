/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createServerAction } from "@/lib/actions/builder";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PERMISSIONS_CONFIG } from "@/lib/security/manifest";
import { revalidatePath } from "next/cache";

/**
 * SCHEMA: UPDATE ROLE PERMISSIONS
 */
const updateRolePermissionsSchema = z.object({
  roleId: z.string(),
  permissionNames: z.array(z.string()),
});

/**
 * ACTION: UPDATE ROLE PERMISSIONS
 * Strictly restricted to users with 'rbac.manage' permission.
 */
export const updateRolePermissions = createServerAction({
  label: "UpdateRolePermissions",
  permissions: ["rbac.manage"],
  schema: updateRolePermissionsSchema,
  revalidatePaths: ["/settings/roles"],
  handler: async ({ input: data, context: ctx }) => {
    // 1. Verify the role belongs to this organization (or is a system role being overridden)
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    // Security check: Only allow modifying roles within the current tenant 
    // or system roles (which will essentially fork it if we wanted to be complex, 
    // but here we allow editing the Role-Permission relation).
    if (role.organizationId && role.organizationId !== ctx.organizationId) {
      throw new Error("Unauthorized access to role");
    }

    // 2. Perform the update
    // We disconnect all current permissions and connect the new ones
    await prisma.role.update({
      where: { id: data.roleId },
      data: {
        permissions: {
          set: [], // Clear all
          connect: data.permissionNames.map(name => ({ name })),
        },
      },
    });

    return { success: true };
  },
});

/**
 * FETCH ALL PERMISSIONS
 */
export async function getAllPermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: { category: "asc" },
  });

  const manifestByName = new Map(
    PERMISSIONS_CONFIG.map((permission) => [permission.name, permission]),
  );

  return permissions.map((permission) => {
    const manifest = manifestByName.get(permission.name);
    return {
      ...permission,
      category: manifest?.category ?? permission.category,
      description: manifest?.description ?? "Controls access to this workspace capability.",
    };
  });
}

/**
 * FETCH ROLES FOR CURRENT ORG
 */
export async function getOrganizationRoles() {
  const { getCurrentTenantContext } = await import("@/lib/tenant");
  const ctx = await getCurrentTenantContext();

  return prisma.role.findMany({
    where: {
      OR: [
        { organizationId: ctx.organizationId },
        { organizationId: null }, // Include system default roles
      ],
    },
    include: {
      permissions: true,
    },
    orderBy: { name: "asc" },
  });
}
