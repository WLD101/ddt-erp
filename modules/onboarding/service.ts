import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── Step Registry ─────────────────────────────────────────────────────────────
export const ONBOARDING_STEPS = [
  { id: "welcome",     label: "Welcome",        skippable: false },
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
  industry: z.string(),
  modules: z.array(z.string()),
});

export const INDUSTRY_MODULES: Record<string, { label: string; modules: { id: string; label: string; description: string }[] }> = {
  retail: {
    label: "Retail",
    modules: [
      { id: "inventory_mgmt", label: "Inventory Management", description: "Real-time stock tracking and alerts." },
      { id: "sales_reports", label: "Sales Reports", description: "Daily sales and profit analytics." },
      { id: "customer_mgmt", label: "Customer Management", description: "CRM and loyalty tracking." },
      { id: "supplier_mgmt", label: "Supplier Management", description: "Purchase orders and vendor bills." },
    ]
  },
  wholesale: {
    label: "Trading / Wholesale",
    modules: [
      { id: "bulk_pricing", label: "Bulk Pricing", description: "Tiered pricing for large orders." },
      { id: "purchases", label: "Purchases", description: "Record supplier bills and inward stock." },
      { id: "inventory_mgmt", label: "Inventory Management", description: "Track stock levels and reorder signals." },
      { id: "reports", label: "Business Reports", description: "Monitor sales, profit, and outstanding balances." },
    ]
  },
  ecommerce: {
    label: "Ecommerce",
    modules: [
      { id: "channel_sync", label: "Channel Sync", description: "Sync products, orders, and stock with connected stores." },
      { id: "csv_import", label: "CSV / Excel Import", description: "Import catalogues and orders without API access." },
      { id: "inventory_mgmt", label: "Inventory Management", description: "Prevent stock mismatch across online channels." },
      { id: "reports", label: "Channel Reports", description: "Track revenue and orders by ecommerce channel." },
    ]
  },
  distribution: {
    label: "Light Distribution",
    modules: [
      { id: "branches", label: "Branches", description: "Manage stock across hubs and sales locations." },
      { id: "inventory_mgmt", label: "Inventory Management", description: "Track dispatch-ready stock by branch." },
      { id: "purchases", label: "Purchases", description: "Receive supplier stock into branch inventory." },
      { id: "reports", label: "Operational Reports", description: "Review movement, low stock, and branch activity." },
    ]
  },
  manufacturing: {
    label: "Manufacturing",
    modules: [
      { id: "products", label: "Products", description: "Manage finished goods and production-ready SKUs." },
      { id: "inventory", label: "Inventory", description: "Track raw materials and finished stock levels." },
      { id: "purchases", label: "Purchases", description: "Receive materials and supplier bills for production." },
      { id: "sales", label: "Sales", description: "Create customer invoices for manufactured goods." },
      { id: "production", label: "Production", description: "Use production workflows for work orders and output tracking." },
    ]
  },
  service_basic: {
    label: "Service Basic",
    modules: [
      { id: "sales_invoices", label: "Sales Invoices", description: "Create invoices for basic service billing." },
      { id: "customers", label: "Customer Management", description: "Manage client records and contact details." },
      { id: "expenses", label: "Expenses", description: "Track service delivery costs and overhead." },
      { id: "reports", label: "Basic Reports", description: "Review invoices, payments, and expenses." },
    ]
  },
};

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
      },
    });
  }

  const steps = state.completedSteps ? state.completedSteps.split(",") : [];
  const completed = steps.filter(s => !s.startsWith("skipped:") && s !== "demoDataInserted");
  const skipped = steps.filter(s => s.startsWith("skipped:")).map(s => s.slice(8));

  // Cast for code compatibility elsewhere
  return {
    ...state,
    completedSteps: completed,
    skippedSteps: skipped,
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
  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      industry: data.industry,
      industryType: data.industry,
      enabledModules: data.modules.join(","),
    },
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
