import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { triggerLifecycleEmail } from "../emails/service";
import { trackEvent, AnalyticCategory } from "../analytics/service";
import { getCurrencyForCountry } from "@/lib/country-currency";

export const voiceSignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(2, "Business name must be at least 2 characters"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  businessType: z.string().optional(),
  callVolume: z.string().optional(),
});

export type VoiceSignUpInput = z.infer<typeof voiceSignUpSchema>;

export async function bootstrapVoiceOrganization(data: VoiceSignUpInput) {
  const { name, phone, password, organizationName, city, country, businessType, callVolume } = data;
  const email = data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists with this email.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const organizationSlug = organizationName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const existingSlugCount = await prisma.organization.count({
    where: {
      slug: {
        startsWith: organizationSlug,
      },
    },
  });

  const resolvedSlug = existingSlugCount === 0 ? organizationSlug : `${organizationSlug}-${existingSlugCount + 1}`;
  const defaultCurrency = getCurrencyForCountry(country);
  const now = new Date();

  const trialDays = 14;
  const demoExpiresAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  const { user, organization: org } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        authStatus: "verified",
        verifiedAt: now,
        emailVerified: now,
        isDemoUser: false,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug: resolvedSlug,
        phone,
        email,
        city,
        country,
        currency: defaultCurrency,
        industry: "VOICE",
        industryType: businessType,
        lifecycleStatus: "onboarding",
        accessStatus: "payment_pending",
        isDemoTenant: false,
        demoExpiresAt: null,
        subscription: {
          create: {
            planId: "unassigned",
            status: "payment_pending",
            paymentStatus: "payment_pending",
            accessStatus: "payment_pending",
            currentPeriodStart: now,
            currentPeriodEnd: now,
          }
        }
      },
    });

    return { user, organization };
  });

  const {
    seedPermissions,
    initializeTenantRoles,
    initializeTenantBranches,
  } = await import("@/lib/security/seed");

  await seedPermissions();
  await initializeTenantRoles(org.id);
  await initializeTenantBranches(org.id);

  const ownerRole = await prisma.role.findUnique({
    where: {
      name_organizationId: {
        name: "owner",
        organizationId: org.id,
      },
    },
  });

  if (!ownerRole) {
    throw new Error("Failed to initialize roles");
  }

  await prisma.$transaction([
    prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        roleId: ownerRole.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        action: "INITIAL_SIGNUP",
        entityType: "Organization",
        entityId: org.id,
        details: `User created Voice organization: ${organizationName} (Type: ${businessType}, Volume: ${callVolume})`,
      },
    }),
  ]);

  void trackEvent({
    name: "VOICE_SIGNUP_COMPLETED",
    category: AnalyticCategory.AUTH,
    userId: user.id,
    organizationId: org.id
  });

  await triggerLifecycleEmail(user.id, org.id, "WELCOME").catch(err => {
    console.error("[Lifecycle Error] Failed to send welcome email:", err);
  });

  return { user, organization: org };
}
