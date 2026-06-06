"use server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createVoiceTenantAction(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const adminEmail = formData.get("adminEmail") as string;

  if (!name || !slug) {
    throw new Error("Name and slug are required");
  }

  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      accessStatus: "active",
      voiceBusinessProfile: {
        create: {
          businessName: name,
          industry: "retail",
          mainGoal: "Customer Service",
          preferredLanguage: "en",
        }
      }
    }
  });

  // If email provided, create user or link
  if (adminEmail) {
    let user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Admin",
        }
      });
    }
    
    let ownerRole = await prisma.role.findFirst({ where: { name: "owner", organizationId: null } });
    if (!ownerRole) {
      ownerRole = await prisma.role.create({ data: { name: "owner", description: "Owner" } });
    }

    await prisma.organizationUser.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        roleId: ownerRole.id,
      }
    });
  }

  redirect(`/voice/admin/tenants/${org.id}`);
}
