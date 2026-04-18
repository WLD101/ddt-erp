import { prisma } from "@/lib/prisma";
import { PERMISSIONS_CONFIG } from "./manifest";

/**
 * SEED PERMISSIONS
 * Ensures all granular keys in the manifest exist in the database.
 */
export async function seedPermissions() {
  console.log("🌱 Seeding permissions...");

  for (const p of PERMISSIONS_CONFIG) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {
        category: p.category,
      },
      create: {
        name: p.name,
        category: p.category,
      },
    });
  }

  console.log(`✅ Seeded ${PERMISSIONS_CONFIG.length} permissions.`);
}

/**
 * INITIALIZE TENANT ROLES
 * Creates default roles (Owner, Admin, Staff) for a new organization.
 */
export async function initializeTenantRoles(organizationId: string) {
  const { DEFAULT_ROLE_MAPPINGS } = await import("./manifest");
  
  console.log(`🏗️ Initializing roles for organization: ${organizationId}`);

  for (const [roleName, permissionNames] of Object.entries(DEFAULT_ROLE_MAPPINGS)) {
    await prisma.role.upsert({
      where: {
        name_organizationId: {
          name: roleName,
          organizationId: organizationId,
        },
      },
      update: {
        permissions: {
          set: [],
          connect: permissionNames.map(name => ({ name })),
        },
      },
      create: {
        name: roleName,
        organizationId: organizationId,
        permissions: {
          connect: permissionNames.map(name => ({ name })),
        },
      },
    });
  }
}

/**
 * INITIALIZE TENANT BRANCHES
 * Creates the default 'Main Branch' for a new organization.
 */
export async function initializeTenantBranches(organizationId: string) {
  console.log(`🏗️ Initializing default branch for organization: ${organizationId}`);

  return prisma.branch.upsert({
    where: {
      id_organizationId: {
        id: "main-branch-" + organizationId, // Deterministic ID for migration safety
        organizationId: organizationId,
      },
    },
    update: {},
    create: {
      id: "main-branch-" + organizationId,
      organizationId: organizationId,
      name: "Main Branch",
      code: "MAIN",
      isMain: true,
  });
}

/**
 * INITIALIZE TENANT FINANCES
 * Creates a default 'Main Cash' account for a new organization.
 */
export async function initializeTenantFinances(organizationId: string) {
  console.log(`🏗️ Initializing default financial account for organization: ${organizationId}`);

  return prisma.financialAccount.upsert({
    where: {
      id_organizationId: {
        id: "main-cash-" + organizationId, // Deterministic ID
        organizationId: organizationId,
      },
    },
    update: {},
    create: {
      id: "main-cash-" + organizationId,
      organizationId: organizationId,
      name: "Main Cash",
      type: "CASH",
      isDefault: true,
      currentBalance: 0,
    },
  });
}
