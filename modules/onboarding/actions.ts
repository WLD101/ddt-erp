"use server";

import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getTenantStore } from "@/lib/db/client";
import * as service from "./service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { trackEvent, AnalyticCategory } from "../analytics/service";

// ─── Get current onboarding state ─────────────────────────────────────────────
export async function getOnboardingState() {
  const ctx = await getCurrentTenantContext();
  const state = await service.getOnboardingState(ctx.organizationId);
  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { industry: true }
  });

  return {
    ...state,
    industry: org?.industry
  };
}

// ─── Save business profile ────────────────────────────────────────────────────
export async function saveBusinessProfile(data: z.infer<typeof service.profileSchema>) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const parsed = service.profileSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    await service.updateBusinessProfile(ctx.organizationId, parsed.data);
    await service.markStepDone(ctx.organizationId, "profile");
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as any).message };
  }
}

// ─── Save welcome / business type (just marks step done) ─────────────────────
export async function saveWelcomeStep(data: z.infer<typeof service.businessTypeSchema>) {
  const ctx = await getCurrentTenantContext();
  try {
    await service.markStepDone(ctx.organizationId, "welcome");
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as any).message };
  }
}

export async function updateIndustryAndModulesAction(data: z.infer<typeof service.industryModulesSchema>) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const parsed = service.industryModulesSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    await service.updateIndustryAndModules(ctx.organizationId, parsed.data);
    await service.markStepDone(ctx.organizationId, "industry");
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as any).message };
  }
}

// ─── Create branch ────────────────────────────────────────────────────────────
export async function saveOnboardingBranch(data: z.infer<typeof service.branchSchema>) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const parsed = service.branchSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    // Check if they already have a main branch — if so, create a secondary one
    const existingMain = await prisma.branch.findFirst({
      where: { organizationId: ctx.organizationId, isMain: true },
    });

    await prisma.branch.create({
      data: {
        organizationId: ctx.organizationId,
        name: parsed.data.name,
        code: parsed.data.code,
        address: parsed.data.address,
        isMain: !existingMain,
      },
    });

    await service.markStepDone(ctx.organizationId, "branch");
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as any).message };
  }
}

// ─── Create product ───────────────────────────────────────────────────────────
export async function saveOnboardingProduct(data: z.infer<typeof service.onboardingProductSchema>) {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const parsed = service.onboardingProductSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const product = await prisma.product.create({
      data: {
        organizationId: ctx.organizationId,
        name: parsed.data.name,
        sku: parsed.data.sku,
        unitPrice: parsed.data.unitPrice,
        costPrice: parsed.data.costPrice,
        lowStockThreshold: parsed.data.lowStockThreshold,
      },
    });

    // Add opening stock to current branch
    if (parsed.data.openingStock > 0) {
      await prisma.inventoryItem.upsert({
        where: {
          organizationId_branchId_productId: {
            organizationId: ctx.organizationId,
            branchId: ctx.branchId,
            productId: product.id,
          },
        },
        create: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          productId: product.id,
          quantity: parsed.data.openingStock,
        },
        update: { quantity: { increment: parsed.data.openingStock } },
      });
    }

    await service.markStepDone(ctx.organizationId, "product");
    
    void trackEvent({
        name: "PRODUCT_CREATED",
        category: AnalyticCategory.INVENTORY,
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        properties: { source: "onboarding" }
    });

    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as any).message };
  }
}

// ─── Create customer ──────────────────────────────────────────────────────────
export async function saveOnboardingCustomer(data: z.infer<typeof service.onboardingCustomerSchema>) {
  const ctx = await getCurrentTenantContext();

  const parsed = service.onboardingCustomerSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    await prisma.customer.create({
      data: {
        organizationId: ctx.organizationId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        address: parsed.data.address,
      },
    });

    await service.markStepDone(ctx.organizationId, "customer");

    void trackEvent({
        name: "CUSTOMER_CREATED",
        category: AnalyticCategory.SALES,
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        properties: { source: "onboarding" }
    });

    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as any).message };
  }
}

// ─── Skip a step ─────────────────────────────────────────────────────────────
export async function skipOnboardingStep(stepId: service.StepId) {
  const ctx = await getCurrentTenantContext();
  try {
    await service.skipStep(ctx.organizationId, stepId);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as any).message };
  }
}

// ─── Complete onboarding ──────────────────────────────────────────────────────
export async function completeOnboarding() {
  const ctx = await getCurrentTenantContext();
  try {
    await service.completeOnboarding(ctx.organizationId);

    void trackEvent({
        name: "ONBOARDING_COMPLETED",
        category: AnalyticCategory.ONBOARDING,
        userId: ctx.userId,
        organizationId: ctx.organizationId
    });

    revalidatePath("/");
    revalidatePath("/onboarding");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as any).message };
  }
}

// ─── Seed demo data ──────────────────────────────────────────────────────────
export async function seedDemoData() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner");
  try {
    const result = await service.seedDemoData(ctx.organizationId, ctx.branchId);
    revalidatePath("/");
    return { success: true, ...result };
  } catch (e) {
    return { success: false, error: (e as any).message };
  }
}

// ─── Guard: should user see onboarding? ──────────────────────────────────────
/**
 * Returns true if this user should be directed to the onboarding wizard.
 * - Only owner/admin on new organizations with incomplete onboarding.
 * - Invited staff users are NOT pushed through owner onboarding.
 */
export async function shouldShowOnboarding(): Promise<boolean> {
  try {
    const ctx = await getCurrentTenantContext();
    if (!["owner", "admin"].includes(ctx.role)) return false;

    const [state, organization] = await Promise.all([
      prisma.onboardingState.findUnique({
        where: { organizationId: ctx.organizationId },
      }),
      prisma.organization.findUnique({
        where: { id: ctx.organizationId },
        select: {
          isDemoTenant: true,
          lifecycleStatus: true,
          accessStatus: true,
        },
      }),
    ]);

    if (state?.isCompleted) return false;
    if (state && !state.isCompleted) return true;
    if (!organization) return false;

    if (organization.isDemoTenant) return true;

    return ["onboarding", "enterprise_pending"].includes(organization.lifecycleStatus)
      || ["onboarding", "payment_pending"].includes(organization.accessStatus);
  } catch {
    return false;
  }
}
