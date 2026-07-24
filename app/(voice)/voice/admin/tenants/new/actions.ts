"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { requirePlatformAdmin } from "@/lib/security/guards";
import {
  initializeTenantBranches,
  initializeTenantFinances,
  initializeTenantRoles,
  seedPermissions,
} from "@/lib/security/seed";

const createVoiceTenantSchema = z.object({
  name: z.string().trim().min(2, "Business name is required.").max(160),
  slug: z.string().trim().min(2, "Slug is required.").max(80),
  adminEmail: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(z.string().email())
    .optional()
    .or(z.literal("")),
});

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueOrganizationSlug(input: string) {
  const base = normalizeSlug(input) || "voice-tenant";
  let candidate = base;
  let suffix = 1;

  while (await prisma.organization.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

export async function createVoiceTenantAction(formData: FormData) {
  const session = await requirePlatformAdmin();

  const input = createVoiceTenantSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    adminEmail: formData.get("adminEmail") || undefined,
  });

  const adminEmail = input.adminEmail || null;
  const adminUser = adminEmail
    ? await prisma.user.findUnique({
        where: { email: adminEmail },
        select: { id: true },
      })
    : null;

  if (adminEmail && !adminUser) {
    throw new Error("Admin email must belong to an existing user. Create or invite the user before attaching them as owner.");
  }

  const slug = await uniqueOrganizationSlug(input.slug);
  const org = await prisma.organization.create({
    data: {
      name: input.name,
      slug,
      accessStatus: "active",
      lifecycleStatus: "active",
      activatedAt: new Date(),
      voiceBusinessProfile: {
        create: {
          businessName: input.name,
          industry: "retail",
          mainGoal: "Customer Service",
          preferredLanguage: "en",
        },
      },
    },
  });

  await seedPermissions();
  await initializeTenantRoles(org.id);
  await initializeTenantBranches(org.id);
  await initializeTenantFinances(org.id);

  if (adminUser) {
    const [ownerRole, mainBranch] = await Promise.all([
      prisma.role.findUnique({
        where: {
          name_organizationId: {
            name: "owner",
            organizationId: org.id,
          },
        },
      }),
      prisma.branch.findFirst({
        where: {
          organizationId: org.id,
          isMain: true,
        },
        select: { id: true },
      }),
    ]);

    if (!ownerRole) {
      throw new Error("Voice tenant was created, but owner role setup failed.");
    }

    await prisma.organizationUser.upsert({
      where: {
        userId_organizationId: {
          userId: adminUser.id,
          organizationId: org.id,
        },
      },
      update: {
        roleId: ownerRole.id,
        assignedBranchId: mainBranch?.id ?? null,
      },
      create: {
        organizationId: org.id,
        userId: adminUser.id,
        roleId: ownerRole.id,
        assignedBranchId: mainBranch?.id ?? null,
      },
    });
  }

  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "VOICE_TENANT_CREATED",
    entityType: "Organization",
    entityId: org.id,
    details: adminEmail
      ? `Created Voice tenant ${input.name} and attached existing owner ${adminEmail}.`
      : `Created Voice tenant ${input.name} without an owner attachment.`,
  });

  revalidatePath("/voice/admin/tenants");
  redirect(`/voice/admin/tenants/${org.id}`);
}
