"use server";

import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";
import { createServerAction } from "@/lib/actions/builder";
import { updateProfileSchema } from "./schema";

// --- ACTIONS ---
export const updateOrganizationProfile = createServerAction({
  label: "Update Profile",
  schema: updateProfileSchema,
  roles: ["owner", "admin"],
  audit: {
    action: "UPDATED_SETTINGS",
    entityType: "Organization",
    getEntityId: () => "profile",
    getDetails: () => "Updated organizational business profile and preferences",
  },
  handler: async ({ input, context: { orgId } }) => {
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        address: input.address,
        country: input.country,
        currency: input.currency,
        timezone: input.timezone,
        taxLabel: input.taxLabel,
      },
    });

    revalidatePath("/(dashboard)/settings", "layout");
    return true;
  },
});
