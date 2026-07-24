import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  getDefaultEnabledModuleIds,
  getIndustryProfile,
  INDUSTRY_PROFILES,
  industryProfileKeySchema,
  onboardingOperationalAnswersSchema,
  resolveIndustryProfileFromLegacyIndustry,
  resolveIndustryProfileRecommendation,
  type OnboardingOperationalAnswers,
} from "./industry-profiles";
import {
  getAvailableIndustryProfilesForMarket,
  getMarketDefaults,
  getMarketProfile,
  marketKeySchema,
  resolveMarketAwareRecommendation,
  resolveMarketKeyFromSignals,
  type MarketKey,
} from "./market-profiles";

// ─── Step Registry ─────────────────────────────────────────────────────────────
export const ONBOARDING_STEPS = [
  { id: "welcome",     label: "Welcome",        skippable: false },
  { id: "market",      label: "Market",         skippable: false },
  { id: "industry",    label: "Industry",       skippable: false },
  { id: "profile",     label: "Business Info",  skippable: false },
  { id: "branch",      label: "Location",       skippable: true  },
  { id: "product",     label: "First Product",  skippable: true  },
  { id: "customer",    label: "First Customer", skippable: true  },
  { id: "invite",      label: "Invite Staff",   skippable: true  },
  { id: "complete",    label: "All Set!",       skippable: false },
] as const;

export type StepId = typeof ONBOARDING_STEPS[number]["id"];
export const TOTAL_STEPS = ONBOARDING_STEPS.length;

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

export const businessTypeSchema = z.object({
  businessType: z.enum(["wholesaler", "retailer", "ecommerce", "distribution", "service", "manufacturing", "other"]),
});

export const profileSchema = z.object({
  name:     z.string().min(2, "Business name must be at least 2 characters"),
  phone:    z.string().optional(),
  email:    z.string().email("Invalid email").optional().or(z.literal("")),
  address:  z.string().optional(),
  country:  z.string().optional(),
  currency: z.string().min(3, "Select a currency").default("USD"),
  timezone: z.string().default("UTC"),
  taxLabel: z.string().optional(),
});

export const marketSelectionSchema = z.object({
  marketKey: marketKeySchema,
});

export const branchSchema = z.object({
  name:    z.string().min(2, "Branch name required"),
  code:    z.string().optional(),
  address: z.string().optional(),
});

export const onboardingProductSchema = z.object({
  name:              z.string().min(2, "Product name required"),
  sku:               z.string().optional(),
  unitPrice:         z.coerce.number().min(0),
  costPrice:         z.coerce.number().min(0).default(0),
  openingStock:      z.coerce.number().min(0).int().default(0),
  lowStockThreshold: z.coerce.number().min(0).int().default(5),
});

export const onboardingCustomerSchema = z.object({
  name:    z.string().min(2, "Customer name required"),
  phone:   z.string().optional(),
  email:   z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
});

export const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role:  z.enum(["admin", "staff"]),
});

export const industryModulesSchema = z.object({
  industry: industryProfileKeySchema,
  modules: z.array(z.string()),
  operationalAnswers: onboardingOperationalAnswersSchema,
});

export const INDUSTRY_MODULES = Object.fromEntries(
  Object.values(INDUSTRY_PROFILES)
    .filter((profile) => ["active", "beta", "planned"].includes(profile.status))
    .map((profile) => [profile.key, { label: profile.name, modules: profile.enabledModules }])
) as Record<string, { label: string; modules: { id: string; label: string; description: string }[] }>;

export function getResolvedIndustryProfile(organization: {
  industry?: string | null;
  industryProfileKey?: string | null;
  enabledModules?: string | null;
  marketKey?: string | null;
}) {
  const availableIndustries =
    organization.marketKey && marketKeySchema.safeParse(organization.marketKey).success
      ? getAvailableIndustryProfilesForMarket(organization.marketKey as MarketKey)
      : null;
  const resolvedKey =
    (organization.industryProfileKey && industryProfileKeySchema.safeParse(organization.industryProfileKey).success
      ? organization.industryProfileKey
      : resolveIndustryProfileFromLegacyIndustry(organization.industry || null)) || "retail";
  const safeResolvedKey =
    availableIndustries && !availableIndustries.includes(resolvedKey as any)
      ? availableIndustries[0]
      : resolvedKey;

  const profile = getIndustryProfile(safeResolvedKey as z.infer<typeof industryProfileKeySchema>);
  const enabledModules = organization.enabledModules
    ? organization.enabledModules.split(",").map((item) => item.trim()).filter(Boolean)
    : getDefaultEnabledModuleIds(profile.key);

  return {
    profile,
    enabledModules,
  };
}

function parseOnboardingAnswers(raw: string | null | undefined): OnboardingOperationalAnswers {
  if (!raw) return onboardingOperationalAnswersSchema.parse({});

  try {
    return onboardingOperationalAnswersSchema.parse(JSON.parse(raw));
  } catch {
    return onboardingOperationalAnswersSchema.parse({});
  }
}

// ─── State Helpers ─────────────────────────────────────────────────────────────

export async function getOnboardingState(organizationId: string) {
  const state = await prisma.onboardingState.findUnique({
    where: { organizationId },
  });

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      marketKey: true,
      industry: true,
      industryProfileKey: true,
      enabledModules: true,
      country: true,
      currency: true,
      locale: true,
      timezone: true,
      countryCode: true,
      pricingProfile: true,
      complianceProfile: true,
      marketRequiresReview: true,
    },
  });

  const inferredMarketKey =
    resolveMarketKeyFromSignals({
      marketKey: organization?.marketKey,
      country: organization?.country,
      currency: organization?.currency,
      timezone: organization?.timezone,
      locale: organization?.locale,
      countryCode: organization?.countryCode,
    }) || "pk";
  const market = getMarketProfile(inferredMarketKey);
  const marketDefaults = getMarketDefaults(inferredMarketKey);

  const resolved = getResolvedIndustryProfile({
    marketKey: inferredMarketKey,
    industry: organization?.industry,
    industryProfileKey: organization?.industryProfileKey,
    enabledModules: organization?.enabledModules,
  });

  if (!state) {
    // Create initial state on first access
    const created = await prisma.onboardingState.create({
      data: {
        organizationId,
        currentStep: 0,
        completedSteps: "",
        selectedMarketKey: organization?.marketKey || inferredMarketKey,
      },
    });

    return {
      ...created,
      selectedMarketKey: created.selectedMarketKey || inferredMarketKey,
      marketKey: inferredMarketKey,
      marketProfile: market,
      marketRequiresReview: organization?.marketRequiresReview ?? organization?.marketKey == null,
      locale: organization?.locale || marketDefaults.locale,
      countryCode: organization?.countryCode || marketDefaults.countryCode,
      currency: organization?.currency || marketDefaults.currency,
      timezone: organization?.timezone || marketDefaults.timezone,
      pricingProfile: organization?.pricingProfile || marketDefaults.pricingProfile,
      complianceProfile: organization?.complianceProfile || marketDefaults.complianceProfile,
      profileDefaults: {
        country: organization?.country || marketDefaults.country,
        currency: organization?.currency || marketDefaults.currency,
        timezone: organization?.timezone || marketDefaults.timezone,
      },
      completedSteps: [],
      skippedSteps: [],
      industry: resolved.profile.key,
      industryProfileKey: resolved.profile.key,
      enabledModules: resolved.enabledModules,
      operationalAnswers: onboardingOperationalAnswersSchema.parse({}),
      profileRecommendation: resolveIndustryProfileRecommendation(resolved.profile.key, onboardingOperationalAnswersSchema.parse({})),
    } as any;
  }

  const steps = state.completedSteps ? state.completedSteps.split(",") : [];
  const completed = steps.filter(s => !s.startsWith("skipped:") && s !== "demoDataInserted");
  const skipped = steps.filter(s => s.startsWith("skipped:")).map(s => s.slice(8));
  const operationalAnswers = parseOnboardingAnswers(state.operationalAnswersJson);
  const recommendedProfileKey = state.recommendedProfileKey || resolved.profile.key;
  const marketAwareRecommendation = resolveMarketAwareRecommendation(
    inferredMarketKey,
    recommendedProfileKey as any,
    operationalAnswers
  );

  // Cast for code compatibility elsewhere
  return {
    ...state,
    selectedMarketKey: state.selectedMarketKey || inferredMarketKey,
    marketKey: inferredMarketKey,
    marketProfile: market,
    marketRequiresReview: organization?.marketRequiresReview ?? organization?.marketKey == null,
    locale: organization?.locale || marketDefaults.locale,
    countryCode: organization?.countryCode || marketDefaults.countryCode,
    currency: organization?.currency || marketDefaults.currency,
    timezone: organization?.timezone || marketDefaults.timezone,
    pricingProfile: organization?.pricingProfile || marketDefaults.pricingProfile,
    complianceProfile: organization?.complianceProfile || marketDefaults.complianceProfile,
    profileDefaults: {
      country: organization?.country || marketDefaults.country,
      currency: organization?.currency || marketDefaults.currency,
      timezone: organization?.timezone || marketDefaults.timezone,
    },
    completedSteps: completed,
    skippedSteps: skipped,
    industry: resolved.profile.key,
    industryProfileKey: resolved.profile.key,
    enabledModules: resolved.enabledModules,
    operationalAnswers,
    profileRecommendation: resolveIndustryProfileRecommendation(recommendedProfileKey as any, operationalAnswers),
    marketRecommendation: marketAwareRecommendation,
  } as any;
}

export async function markStepDone(organizationId: string, stepId: StepId) {
  const state = await prisma.onboardingState.findUnique({ where: { organizationId } });
  const steps = state?.completedSteps ? state.completedSteps.split(",") : [];
  const withoutStep = steps.filter(s => s !== stepId && s !== `skipped:${stepId}`);
  const nextSteps = Array.from(new Set([...withoutStep, stepId]));
  const nextIndex = Math.min((state?.currentStep ?? 0) + 1, TOTAL_STEPS - 1);

  return prisma.onboardingState.update({
    where: { organizationId },
    data: { 
      completedSteps: nextSteps.join(","), 
      currentStep: nextIndex 
    },
  });
}

export async function skipStep(organizationId: string, stepId: StepId) {
  const state = await prisma.onboardingState.findUnique({ where: { organizationId } });
  const steps = state?.completedSteps ? state.completedSteps.split(",") : [];
  const withoutStep = steps.filter(s => s !== stepId && s !== `skipped:${stepId}`);
  const nextSteps = Array.from(new Set([...withoutStep, `skipped:${stepId}`]));
  const nextIndex = Math.min((state?.currentStep ?? 0) + 1, TOTAL_STEPS - 1);

  return prisma.onboardingState.update({
    where: { organizationId },
    data: { 
      completedSteps: nextSteps.join(","), 
      currentStep: nextIndex 
    },
  });
}

export async function completeOnboarding(organizationId: string) {
  return prisma.onboardingState.update({
    where: { organizationId },
    data: {
      isCompleted: true,
      completedAt: new Date(),
      currentStep: TOTAL_STEPS - 1,
    },
  });
}

export async function updateBusinessProfile(organizationId: string, data: z.infer<typeof profileSchema>) {
  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      name:     data.name,
      phone:    data.phone,
      email:    data.email || null,
      address:  data.address,
      country:  data.country,
      currency: data.currency,
      timezone: data.timezone,
      taxLabel: data.taxLabel,
    },
  });
}

export async function updateIndustryAndModules(organizationId: string, data: z.infer<typeof industryModulesSchema>) {
  const resolvedProfile = getIndustryProfile(data.industry);
  const recommendation = resolveIndustryProfileRecommendation(data.industry, data.operationalAnswers);

  return prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: organizationId },
      data: {
        industry: data.industry,
        industryType: data.industry,
        industryProfileKey: resolvedProfile.key,
        enabledModules: data.modules.join(","),
      },
    });

    await tx.onboardingState.upsert({
      where: { organizationId },
      create: {
        organizationId,
        currentStep: 0,
        completedSteps: "",
        operationalAnswersJson: JSON.stringify(data.operationalAnswers),
        recommendedProfileKey: recommendation.profileKey,
      },
      update: {
        operationalAnswersJson: JSON.stringify(data.operationalAnswers),
        recommendedProfileKey: recommendation.profileKey,
      },
    });
  });
}

export async function updateMarketSelection(organizationId: string, data: z.infer<typeof marketSelectionSchema>) {
  const defaults = getMarketDefaults(data.marketKey);

  return prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: organizationId },
      data: {
        marketKey: data.marketKey,
        country: defaults.country,
        currency: defaults.currency,
        locale: defaults.locale,
        timezone: defaults.timezone,
        countryCode: defaults.countryCode,
        pricingProfile: defaults.pricingProfile,
        complianceProfile: defaults.complianceProfile,
        marketRequiresReview: false,
      },
    });

    await tx.onboardingState.upsert({
      where: { organizationId },
      create: {
        organizationId,
        currentStep: 0,
        completedSteps: "",
        selectedMarketKey: data.marketKey,
      },
      update: {
        selectedMarketKey: data.marketKey,
      },
    });
  });
}

// ─── Demo Data Seeder ──────────────────────────────────────────────────────────

export async function seedDemoData(organizationId: string, branchId: string) {
  // Guard: only insert once
  const state = await prisma.onboardingState.findUnique({ where: { organizationId } });
  const steps = state?.completedSteps ? state.completedSteps.split(",") : [];
  if (steps.includes("demoDataInserted")) return { alreadySeeded: true };

  await prisma.$transaction(async (tx) => {
    // Demo Supplier
    await tx.supplier.create({
      data: {
        organizationId,
        name: "Demo Supplier Co.",
        email: "demo-supplier@example.com",
        phone: "+1-555-0100",
        address: "123 Supply Road, Commerce City",
      },
    });

    // Demo Customers
    const customer1 = await tx.customer.create({
      data: {
        organizationId,
        name: "Acme Retail Ltd.",
        email: "acme@example.com",
        phone: "+1-555-0200",
        address: "456 Buyer Avenue, Retail Town",
      },
    });
    await tx.customer.create({
      data: {
        organizationId,
        name: "Metro Wholesale Inc.",
        email: "metro@example.com",
        phone: "+1-555-0201",
      },
    });

    // Demo Products
    const product1 = await tx.product.create({
      data: {
        organizationId,
        name: "[DEMO] Premium Widget A",
        sku: "DEMO-WGT-A",
        unitPrice: 49.99,
        costPrice: 28.00,
        lowStockThreshold: 10,
      },
    });
    const product2 = await tx.product.create({
      data: {
        organizationId,
        name: "[DEMO] Standard Widget B",
        sku: "DEMO-WGT-B",
        unitPrice: 24.99,
        costPrice: 12.00,
        lowStockThreshold: 15,
      },
    });

    // Demo Inventory
    await tx.inventoryItem.createMany({
      data: [
        { organizationId, branchId, productId: product1.id, quantity: 80 },
        { organizationId, branchId, productId: product2.id, quantity: 120 },
      ],
    });

    // Demo Quotation
    await tx.quotation.create({
      data: {
        organizationId,
        branchId,
        customerId: customer1.id,
        status: "SENT",
        totalAmount: 249.95,
        items: {
          create: [
            { productId: product1.id, quantity: 3, unitPrice: 49.99, total: 149.97 },
            { productId: product2.id, quantity: 4, unitPrice: 24.99, total: 99.96 },
          ],
        },
      },
    });
  });

  // Mark demo data flag
  const nextSteps = Array.from(new Set([...steps, "demoDataInserted"]));
  await prisma.onboardingState.update({
    where: { organizationId },
    data: { completedSteps: nextSteps.join(",") },
  });

  return { seeded: true };
}
