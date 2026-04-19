import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── Step Registry ─────────────────────────────────────────────────────────────
export const ONBOARDING_STEPS = [
  { id: "welcome",     label: "Welcome",        skippable: false },
  { id: "profile",     label: "Business Info",  skippable: false },
  { id: "branch",      label: "Location",       skippable: true  },
  { id: "product",     label: "First Product",  skippable: true  },
  { id: "customer",    label: "First Customer", skippable: true  },
  { id: "invite",      label: "Invite Staff",   skippable: true  },
  { id: "transaction", label: "First Deal",     skippable: true  },
  { id: "complete",    label: "All Set!",       skippable: false },
] as const;

export type StepId = typeof ONBOARDING_STEPS[number]["id"];
export const TOTAL_STEPS = ONBOARDING_STEPS.length;

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

export const businessTypeSchema = z.object({
  businessType: z.enum(["wholesaler", "retailer", "reseller", "service", "other"]),
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

export const branchSchema = z.object({
  name:    z.string().min(2, "Branch name required"),
  code:    z.string().optional(),
  address: z.string().optional(),
});

export const onboardingProductSchema = z.object({
  name:              z.string().min(2, "Product name required"),
  sku:               z.string().optional(),
  unitPrice:         z.number().min(0),
  costPrice:         z.number().min(0).default(0),
  openingStock:      z.number().min(0).int().default(0),
  lowStockThreshold: z.number().min(0).int().default(5),
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

// ─── State Helpers ─────────────────────────────────────────────────────────────

export async function getOnboardingState(organizationId: string) {
  const state = await prisma.onboardingState.findUnique({
    where: { organizationId },
  });

  if (!state) {
    // Create initial state on first access
    return prisma.onboardingState.create({
      data: {
        organizationId,
        currentStep: 0,
        completedSteps: "",
        skippedSteps: "",
      },
    });
  }

  // Cast for code compatibility elsewhere
  return {
    ...state,
    completedSteps: state.completedSteps ? state.completedSteps.split(",") : [],
    skippedSteps: state.skippedSteps ? state.skippedSteps.split(",") : [],
  } as any;
}

export async function markStepDone(organizationId: string, stepId: StepId) {
  const state = await getOnboardingState(organizationId);
  const completedSteps = Array.from(new Set([...state.completedSteps, stepId]));
  const nextIndex = Math.min(state.currentStep + 1, TOTAL_STEPS - 1);

  return prisma.onboardingState.update({
    where: { organizationId },
    data: { 
      completedSteps: completedSteps.join(","), 
      currentStep: nextIndex 
    },
  });
}

export async function skipStep(organizationId: string, stepId: StepId) {
  const state = await getOnboardingState(organizationId);
  const skippedSteps = Array.from(new Set([...state.skippedSteps, stepId]));
  const nextIndex = Math.min(state.currentStep + 1, TOTAL_STEPS - 1);

  return prisma.onboardingState.update({
    where: { organizationId },
    data: { 
      skippedSteps: skippedSteps.join(","), 
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

// ─── Demo Data Seeder ──────────────────────────────────────────────────────────

export async function seedDemoData(organizationId: string, branchId: string) {
  // Guard: only insert once
  const state = await prisma.onboardingState.findUnique({ where: { organizationId } });
  if (state?.demoDataInserted) return { alreadySeeded: true };

  await prisma.$transaction(async (tx) => {
    // Demo Supplier
    const supplier = await tx.supplier.create({
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
    const customer2 = await tx.customer.create({
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
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14);

    await tx.quotation.create({
      data: {
        organizationId,
        branchId,
        customerId: customer1.id,
        quotationNumber: "QT-DEMO-001",
        status: "SENT",
        expiryDate,
        subtotal: 249.95,
        discount: 0,
        totalAmount: 249.95,
        notes: "This is a demo quotation created during onboarding. You can delete it when ready.",
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
  await prisma.onboardingState.update({
    where: { organizationId },
    data: { demoDataInserted: true },
  });

  return { seeded: true };
}
