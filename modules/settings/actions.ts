"use server";

import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerAction } from "@/lib/actions/builder";

// --- VALIDATION ---
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().min(3, "Currency required").default("USD"),
  timezone: z.string().default("UTC"),
  taxLabel: z.string().optional(),
});

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
