/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

import { seedPermissions, initializeTenantRoles } from "../lib/security/seed";
import { getBootstrapAdminPassword, isProductionEnv } from "../lib/security/env";

const prisma = new PrismaClient();

const DEMO_EMAIL = "admin@alsadiq.local";
const DEMO_PASSWORD = "Demo123!";
const ORG_SLUG = "al-sadiq-traders";
const ORG_NAME = "Al Sadiq Traders";

function getBootstrapAdminEmail() {
  const emails = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length > 0) {
    return emails[0];
  }

  return "admin@whatsquery.com";
}

const ADMIN_EMAIL = getBootstrapAdminEmail();
const ADMIN_PASSWORD =
  process.env.NODE_ENV === "production"
    ? getBootstrapAdminPassword()
    : process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD || "ChangeMe123!";

const branchSeeds = [
  {
    key: "karachi",
    name: "Karachi Head Office",
    code: "KHI-HQ",
    address: "Warehouse Plot 14, Korangi Industrial Area, Karachi",
    isMain: true,
  },
  {
    key: "lahore",
    name: "Lahore Distribution Hub",
    code: "LHE-DC",
    address: "Gate 3, Sundar Industrial Estate, Lahore",
    isMain: false,
  },
  {
    key: "rawalpindi",
    name: "Rawalpindi Cash & Carry",
    code: "RWP-CC",
    address: "Main Peshawar Road, Rawalpindi",
    isMain: false,
  },
];

const customerSeeds = [
  ["Noor General Store", "Karachi", "021-35110001"],
  ["Bismillah Cash & Carry", "Karachi", "021-35110002"],
  ["Al Madina Mart", "Karachi", "021-35110003"],
  ["Usman Kiryana", "Hyderabad", "022-26110004"],
  ["Rizwan Traders", "Lahore", "042-37110005"],
  ["Punjab Grocery Point", "Lahore", "042-37110006"],
  ["Sabir Departmental Store", "Lahore", "042-37110007"],
  ["Faisal Mini Mart", "Faisalabad", "041-26110008"],
  ["Capital Super Store", "Islamabad", "051-23110009"],
  ["Pindi Wholesale Centre", "Rawalpindi", "051-23110010"],
  ["Gulshan Mart", "Karachi", "021-35110011"],
  ["Rehman Bakers & Store", "Sialkot", "052-35110012"],
  ["Awan Traders", "Multan", "061-65110013"],
  ["Iqbal Super Mart", "Bahawalpur", "062-25110014"],
  ["New Prince Store", "Gujranwala", "055-32110015"],
  ["Makkah Retail Hub", "Peshawar", "091-57110016"],
  ["Saeed & Sons Store", "Quetta", "081-28110017"],
  ["City Choice Store", "Islamabad", "051-23110018"],
  ["Khyber Family Mart", "Peshawar", "091-57110019"],
  ["Safa Super Market", "Rawalpindi", "051-23110020"],
].map(([name, city, phone], index) => ({
  name,
  city,
  phone,
  email: `accounts${index + 1}@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.pk`,
  address: `${city}, Pakistan`,
}));

const supplierSeeds = [
  "National Foods Distribution",
  "Unity Edible Oils",
  "Punjab Rice Suppliers",
  "Karachi Beverage Wholesale",
  "Pak Home Care Industries",
  "Sunrise Personal Care",
  "Lahore Packaging House",
  "Metro Stationery & Goods",
  "Safa Tissue Products",
  "Hamdard Consumer Lines",
].map((name, index) => ({
  name,
  email: `sales${index + 1}@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.pk`,
  phone: `03${10 + index}${20 + index}55667${index}`,
  address: `Industrial Estate ${index + 1}, Pakistan`,
}));

const productSeeds = [
  { category: "Staples", name: "Super Basmati Rice 5kg", sku: "AST-RICE-5KG", costPrice: 1080, unitPrice: 1240, lowStockThreshold: 12 },
  { category: "Staples", name: "Premium Basmati Rice 1kg", sku: "AST-RICE-1KG", costPrice: 225, unitPrice: 265, lowStockThreshold: 18 },
  { category: "Staples", name: "Chakki Atta 10kg", sku: "AST-ATTA-10KG", costPrice: 1085, unitPrice: 1185, lowStockThreshold: 10 },
  { category: "Staples", name: "Fine Maida 2.5kg", sku: "AST-MAIDA-2KG", costPrice: 245, unitPrice: 295, lowStockThreshold: 16 },
  { category: "Staples", name: "Daal Chana 1kg", sku: "AST-DCHANA-1KG", costPrice: 228, unitPrice: 275, lowStockThreshold: 20 },
  { category: "Staples", name: "Daal Masoor 1kg", sku: "AST-DMASOOR-1KG", costPrice: 248, unitPrice: 295, lowStockThreshold: 20 },
  { category: "Staples", name: "White Sugar 1kg", sku: "AST-SUGAR-1KG", costPrice: 150, unitPrice: 175, lowStockThreshold: 24 },
  { category: "Staples", name: "Himalayan Pink Salt 800g", sku: "AST-SALT-800G", costPrice: 70, unitPrice: 95, lowStockThreshold: 15 },
  { category: "Staples", name: "Cooking Oil 5L", sku: "AST-OIL-5L", costPrice: 2520, unitPrice: 2795, lowStockThreshold: 8 },
  { category: "Staples", name: "Banaspati Ghee Tin 1kg", sku: "AST-GHEE-1KG", costPrice: 495, unitPrice: 560, lowStockThreshold: 12 },

  { category: "Beverages", name: "Black Tea 475g", sku: "AST-TEA-475G", costPrice: 890, unitPrice: 990, lowStockThreshold: 10 },
  { category: "Beverages", name: "Green Tea 100 Bags", sku: "AST-GTEA-100", costPrice: 355, unitPrice: 420, lowStockThreshold: 14 },
  { category: "Beverages", name: "Instant Coffee 200g", sku: "AST-COFFEE-200", costPrice: 1180, unitPrice: 1325, lowStockThreshold: 10 },
  { category: "Beverages", name: "UHT Milk 1L", sku: "AST-MILK-1L", costPrice: 205, unitPrice: 235, lowStockThreshold: 30 },
  { category: "Beverages", name: "Mango Fruit Drink 1L", sku: "AST-MANGO-1L", costPrice: 148, unitPrice: 175, lowStockThreshold: 22 },
  { category: "Beverages", name: "Cola Drink 1.5L", sku: "AST-COLA-15L", costPrice: 165, unitPrice: 210, lowStockThreshold: 25 },
  { category: "Beverages", name: "Mineral Water 1.5L", sku: "AST-WATER-15L", costPrice: 58, unitPrice: 75, lowStockThreshold: 40 },
  { category: "Beverages", name: "Rooh Afza 800ml", sku: "AST-ROOH-800", costPrice: 340, unitPrice: 395, lowStockThreshold: 12 },
  { category: "Beverages", name: "Falooda Syrup 800ml", sku: "AST-FALOODA-800", costPrice: 278, unitPrice: 330, lowStockThreshold: 10 },
  { category: "Beverages", name: "Lemon Malt 330ml", sku: "AST-MALT-330", costPrice: 68, unitPrice: 85, lowStockThreshold: 28 },

  { category: "Snacks", name: "Salt Biscuits Family Pack", sku: "AST-BISCUIT-SALT", costPrice: 82, unitPrice: 105, lowStockThreshold: 20 },
  { category: "Snacks", name: "Chocolate Biscuits Family Pack", sku: "AST-BISCUIT-CHOCO", costPrice: 92, unitPrice: 118, lowStockThreshold: 20 },
  { category: "Snacks", name: "Potato Chips 70g", sku: "AST-CHIPS-70", costPrice: 48, unitPrice: 65, lowStockThreshold: 36 },
  { category: "Snacks", name: "Nimko Mix 200g", sku: "AST-NIMKO-200", costPrice: 118, unitPrice: 155, lowStockThreshold: 18 },
  { category: "Snacks", name: "Khajla Rusks 24 Pack", sku: "AST-RUSK-24", costPrice: 188, unitPrice: 235, lowStockThreshold: 14 },
  { category: "Snacks", name: "Instant Noodles 4 Pack", sku: "AST-NOODLE-4", costPrice: 118, unitPrice: 145, lowStockThreshold: 18 },
  { category: "Snacks", name: "Namkeen Peanuts 150g", sku: "AST-PEANUT-150", costPrice: 64, unitPrice: 85, lowStockThreshold: 18 },
  { category: "Snacks", name: "Fruit Jelly Cups 6 Pack", sku: "AST-JELLY-6", costPrice: 86, unitPrice: 112, lowStockThreshold: 18 },
  { category: "Snacks", name: "Plain Cake Rusk 12 Pack", sku: "AST-CAKERUSK-12", costPrice: 92, unitPrice: 125, lowStockThreshold: 16 },
  { category: "Snacks", name: "Oat Cookies 150g", sku: "AST-COOKIE-OAT", costPrice: 108, unitPrice: 138, lowStockThreshold: 16 },

  { category: "Personal Care", name: "Classic Bath Soap 100g", sku: "AST-SOAP-100", costPrice: 58, unitPrice: 75, lowStockThreshold: 24 },
  { category: "Personal Care", name: "Beauty Soap 100g", sku: "AST-BEAUTY-100", costPrice: 72, unitPrice: 92, lowStockThreshold: 20 },
  { category: "Personal Care", name: "Daily Shampoo 180ml", sku: "AST-SHAMPOO-180", costPrice: 188, unitPrice: 235, lowStockThreshold: 16 },
  { category: "Personal Care", name: "Silk Conditioner 180ml", sku: "AST-CONDITION-180", costPrice: 196, unitPrice: 245, lowStockThreshold: 12 },
  { category: "Personal Care", name: "Family Toothpaste 120g", sku: "AST-TPASTE-120", costPrice: 98, unitPrice: 125, lowStockThreshold: 20 },
  { category: "Personal Care", name: "Soft Toothbrush", sku: "AST-TBRUSH-SOFT", costPrice: 42, unitPrice: 58, lowStockThreshold: 24 },
  { category: "Personal Care", name: "Talcum Powder 100g", sku: "AST-TALC-100", costPrice: 104, unitPrice: 130, lowStockThreshold: 12 },
  { category: "Personal Care", name: "Sanitary Pads 8 Pack", sku: "AST-PADS-8", costPrice: 168, unitPrice: 210, lowStockThreshold: 14 },
  { category: "Personal Care", name: "Baby Diapers Medium 24 Pack", sku: "AST-DIAPER-M24", costPrice: 815, unitPrice: 980, lowStockThreshold: 8 },
  { category: "Personal Care", name: "Antibacterial Handwash 500ml", sku: "AST-HANDWASH-500", costPrice: 172, unitPrice: 210, lowStockThreshold: 12 },

  { category: "Home Care", name: "Laundry Powder 1kg", sku: "AST-LAUNDRY-1KG", costPrice: 268, unitPrice: 330, lowStockThreshold: 15 },
  { category: "Home Care", name: "Dishwash Bar 400g", sku: "AST-DISHBAR-400", costPrice: 56, unitPrice: 74, lowStockThreshold: 24 },
  { category: "Home Care", name: "Floor Cleaner 1L", sku: "AST-FLOOR-1L", costPrice: 184, unitPrice: 235, lowStockThreshold: 14 },
  { category: "Home Care", name: "Bleach 1L", sku: "AST-BLEACH-1L", costPrice: 94, unitPrice: 125, lowStockThreshold: 14 },
  { category: "Home Care", name: "Glass Cleaner 500ml", sku: "AST-GLASS-500", costPrice: 112, unitPrice: 145, lowStockThreshold: 12 },
  { category: "Home Care", name: "Toilet Cleaner 500ml", sku: "AST-TOILET-500", costPrice: 118, unitPrice: 150, lowStockThreshold: 12 },
  { category: "Home Care", name: "Tissue Roll 4 Pack", sku: "AST-TISSUE-4", costPrice: 168, unitPrice: 205, lowStockThreshold: 18 },
  { category: "Home Care", name: "Paper Napkins 100 Pack", sku: "AST-NAPKIN-100", costPrice: 72, unitPrice: 95, lowStockThreshold: 20 },
  { category: "Home Care", name: "Trash Bags Large 30 Pack", sku: "AST-BAG-L30", costPrice: 142, unitPrice: 178, lowStockThreshold: 12 },
  { category: "Home Care", name: "Mosquito Coil 10 Pack", sku: "AST-COIL-10", costPrice: 74, unitPrice: 95, lowStockThreshold: 16 },

  { category: "General Merchandise", name: "LED Bulb 12W", sku: "AST-BULB-12W", costPrice: 178, unitPrice: 230, lowStockThreshold: 14 },
  { category: "General Merchandise", name: "AA Batteries 4 Pack", sku: "AST-BATT-AA4", costPrice: 126, unitPrice: 165, lowStockThreshold: 18 },
  { category: "General Merchandise", name: "Extension Board 3 Socket", sku: "AST-EXT-3S", costPrice: 395, unitPrice: 480, lowStockThreshold: 8 },
  { category: "General Merchandise", name: "Ball Pen Box 10", sku: "AST-PEN-10", costPrice: 92, unitPrice: 128, lowStockThreshold: 18 },
  { category: "General Merchandise", name: "Register Notebook A4", sku: "AST-NOTE-A4", costPrice: 108, unitPrice: 145, lowStockThreshold: 20 },
  { category: "General Merchandise", name: "Packing Tape 2in", sku: "AST-TAPE-2IN", costPrice: 54, unitPrice: 72, lowStockThreshold: 25 },
  { category: "General Merchandise", name: "Shipping Carton Medium", sku: "AST-CARTON-M", costPrice: 58, unitPrice: 82, lowStockThreshold: 22 },
  { category: "General Merchandise", name: "Permanent Marker", sku: "AST-MARKER-P", costPrice: 44, unitPrice: 62, lowStockThreshold: 18 },
  { category: "General Merchandise", name: "Thermal Receipt Roll", sku: "AST-THERMAL-R", costPrice: 34, unitPrice: 48, lowStockThreshold: 30 },
  { category: "General Merchandise", name: "Desk Calculator Mini", sku: "AST-CALC-MINI", costPrice: 245, unitPrice: 315, lowStockThreshold: 8 },
];

const lowStockSkus = new Set([
  "AST-RICE-5KG",
  "AST-OIL-5L",
  "AST-TEA-475G",
  "AST-DIAPER-M24",
  "AST-LAUNDRY-1KG",
  "AST-BULB-12W",
  "AST-THERMAL-R",
  "AST-TISSUE-4",
]);

const CREDENTIALS_ALGORITHM = "aes-256-gcm";
const CREDENTIALS_KEY_LENGTH = 32;
const CREDENTIALS_IV_LENGTH = 16;

function getIntegrationSecret() {
  const secret =
    process.env.INTEGRATION_CREDENTIAL_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      "Missing integration credential secret. Set INTEGRATION_CREDENTIAL_SECRET or reuse AUTH_SECRET/NEXTAUTH_SECRET."
    );
  }

  return secret;
}

function encryptIntegrationCredentials(credentials: Record<string, unknown>) {
  const iv = crypto.randomBytes(CREDENTIALS_IV_LENGTH);
  const key = crypto.scryptSync(
    getIntegrationSecret(),
    "erp-sales-channel-credentials",
    CREDENTIALS_KEY_LENGTH
  );
  const cipher = crypto.createCipheriv(CREDENTIALS_ALGORITHM, key, iv);
  const payload = JSON.stringify(credentials);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function sum(items: Array<{ total: number }>) {
  return items.reduce((total, item) => total + item.total, 0);
}

async function resetExistingDemoOrg() {
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: ORG_SLUG },
    select: { id: true, name: true },
  });

  if (existingOrg) {
    console.log(`Existing demo org found (${existingOrg.name}). Reusing current workspace data.`);
    return existingOrg;
  }

  return null;
}

async function ensureDemoUser() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: "Al Sadiq Demo Admin",
      password: passwordHash,
      phone: "+92-300-1112233",
      authStatus: "verified",
      verifiedAt: new Date(),
      emailVerified: new Date(),
      isDemoUser: false,
    },
    create: {
      name: "Al Sadiq Demo Admin",
      email: DEMO_EMAIL,
      password: passwordHash,
      phone: "+92-300-1112233",
      authStatus: "verified",
      verifiedAt: new Date(),
      emailVerified: new Date(),
      isDemoUser: false,
    },
  });
}

async function ensureAdminUser() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  return prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "WhatsQuery Admin",
      password: passwordHash,
      authStatus: "verified",
      verifiedAt: new Date(),
    },
    create: {
      name: "WhatsQuery Admin",
      email: ADMIN_EMAIL,
      password: passwordHash,
      authStatus: "verified",
      verifiedAt: new Date(),
    },
  });
}

async function seedPackages() {
  const { PLANS } = await import("../lib/billing/plans");
  console.log("🌱 Seeding packages...");

  for (const plan of Object.values(PLANS)) {
    await prisma.package.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        businessSize: plan.audience,
        userLimit: plan.limits.maxUsers,
        featureJson: JSON.stringify(plan.features),
      },
      create: {
        id: plan.id,
        name: plan.name,
        businessSize: plan.audience,
        userLimit: plan.limits.maxUsers,
        featureJson: JSON.stringify(plan.features),
      },
    });
  }
}

async function main() {
  if (isProductionEnv()) {
    throw new Error("scripts/final-seed.ts is for local/demo seeding only. Use `npm run seed:prod` on production.");
  }

  console.log("Seeding Al Sadiq Traders demo workspace...");

  await seedPermissions();
  await seedPackages();
  const user = await ensureDemoUser();
  await ensureAdminUser();
  const existingOrg = await resetExistingDemoOrg();

  if (existingOrg) {
    console.log(`Login email: ${DEMO_EMAIL}`);
    console.log(`Login password: ${DEMO_PASSWORD}`);
    return;
  }

  const organization = await prisma.organization.create({
    data: {
      name: ORG_NAME,
      slug: ORG_SLUG,
      phone: "+92-21-35123456",
      email: "info@alsadiqtraders.pk",
      address: "Plot 22, Sector 12-B, Korangi Industrial Area",
      city: "Karachi",
      country: "Pakistan",
      currency: "PKR",
      timezone: "Asia/Karachi",
      taxLabel: "GST",
      lifecycleStatus: "active",
      accessStatus: "active",
      isDemoTenant: false,
      subscription: {
        create: {
          planId: "pro",
          status: "active",
          paymentStatus: "active",
          accessStatus: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: daysAgo(-30),
        },
      },
    },
  });

  await initializeTenantRoles(organization.id);

  const ownerRole = await prisma.role.findUniqueOrThrow({
    where: {
      name_organizationId: {
        name: "owner",
        organizationId: organization.id,
      },
    },
  });

  const branches = {} as Record<string, { id: string; name: string }>;
  for (const branch of branchSeeds) {
    const created = await prisma.branch.create({
      data: {
        organizationId: organization.id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        isMain: branch.isMain,
      },
    });
    branches[branch.key] = { id: created.id, name: created.name };
  }

  await prisma.organizationUser.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      roleId: ownerRole.id,
      assignedBranchId: branches.karachi.id,
    },
  });

  await prisma.onboardingState.create({
    data: {
      organizationId: organization.id,
      currentStep: 7,
      completedSteps: JSON.stringify(["welcome", "profile", "branch", "product", "customer", "invite", "transaction"]),
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  const accounts = {
    cash: await prisma.financialAccount.create({
      data: {
        organizationId: organization.id,
        name: "Main Cash Counter",
        type: "CASH",
        currentBalance: 279000,
        isDefault: true,
        isActive: true,
      },
    }),
    bank: await prisma.financialAccount.create({
      data: {
        organizationId: organization.id,
        name: "Meezan Bank - Business Current",
        type: "BANK",
        accountNumber: "PK92-MEEZ-0044221100",
        bankName: "Meezan Bank",
        currentBalance: 1652000,
        isActive: true,
      },
    }),
    wallet: await prisma.financialAccount.create({
      data: {
        organizationId: organization.id,
        name: "JazzCash Collection Wallet",
        type: "CASH",
        accountNumber: "0300-1112233",
        currentBalance: 85000,
        isActive: true,
      },
    }),
  };

  const categories = {} as Record<string, { id: string; name: string }>;
  for (const categoryName of [...new Set(productSeeds.map((product) => product.category))]) {
    const category = await prisma.category.create({
      data: {
        organizationId: organization.id,
        name: categoryName,
        description: `${categoryName} catalogue for Al Sadiq Traders`,
      },
    });
    categories[categoryName] = { id: category.id, name: category.name };
  }

  const customers = [] as Array<{ id: string; name: string }>;
  for (const customer of customerSeeds) {
    customers.push(
      await prisma.customer.create({
        data: {
          organizationId: organization.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        },
      })
    );
  }

  const suppliers = [] as Array<{ id: string; name: string }>;
  for (const supplier of supplierSeeds) {
    suppliers.push(
      await prisma.supplier.create({
        data: {
          organizationId: organization.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
        },
      })
    );
  }

  const products = {} as Record<
    string,
    {
      id: string;
      name: string;
      sku: string;
      unitPrice: number;
      costPrice: number;
      lowStockThreshold: number;
      categoryId: string;
      categoryName: string;
    }
  >;

  for (let index = 0; index < productSeeds.length; index += 1) {
    const seed = productSeeds[index];
    const created = await prisma.product.create({
      data: {
        organizationId: organization.id,
        name: seed.name,
        sku: seed.sku,
        categoryId: categories[seed.category].id,
        unitPrice: seed.unitPrice,
        costPrice: seed.costPrice,
        lowStockThreshold: seed.lowStockThreshold,
      },
    });

    products[seed.sku] = {
      id: created.id,
      name: created.name,
      sku: created.sku || seed.sku,
      unitPrice: created.unitPrice,
      costPrice: created.costPrice,
      lowStockThreshold: created.lowStockThreshold,
      categoryId: categories[seed.category].id,
      categoryName: seed.category,
    };
  }

  const inventoryRecords: Array<{
    organizationId: string;
    branchId: string;
    productId: string;
    quantity: number;
    location: string;
  }> = [];

  productSeeds.forEach((seed, index) => {
    const mainQuantity = lowStockSkus.has(seed.sku) ? Math.max(1, Math.floor(seed.lowStockThreshold / 2)) : 18 + ((index * 7) % 65);
    const lahoreQuantity = 12 + ((index * 5) % 38);
    const rawalpindiQuantity = 8 + ((index * 3) % 22);

    inventoryRecords.push(
      {
        organizationId: organization.id,
        branchId: branches.karachi.id,
        productId: products[seed.sku].id,
        quantity: mainQuantity,
        location: `K-${String(index + 1).padStart(3, "0")}`,
      },
      {
        organizationId: organization.id,
        branchId: branches.lahore.id,
        productId: products[seed.sku].id,
        quantity: lahoreQuantity,
        location: `L-${String(index + 1).padStart(3, "0")}`,
      },
      {
        organizationId: organization.id,
        branchId: branches.rawalpindi.id,
        productId: products[seed.sku].id,
        quantity: rawalpindiQuantity,
        location: `R-${String(index + 1).padStart(3, "0")}`,
      }
    );
  });

  await prisma.inventoryItem.createMany({ data: inventoryRecords });

  const salesInvoiceSeeds = [
    {
      invoiceNumber: "AST-SI-260401",
      customerIndex: 0,
      date: daysAgo(28),
      dueDate: daysAgo(18),
      status: "PAID",
      discount: 250,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-RICE-5KG", quantity: 8 },
        { sku: "AST-OIL-5L", quantity: 4 },
        { sku: "AST-TEA-475G", quantity: 3 },
      ],
    },
    {
      invoiceNumber: "AST-SI-260404",
      customerIndex: 2,
      date: daysAgo(24),
      dueDate: daysAgo(14),
      status: "PAID",
      discount: 0,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-MILK-1L", quantity: 18 },
        { sku: "AST-SUGAR-1KG", quantity: 12 },
        { sku: "AST-BISCUIT-SALT", quantity: 10 },
      ],
    },
    {
      invoiceNumber: "AST-SI-260407",
      customerIndex: 4,
      date: daysAgo(21),
      dueDate: daysAgo(7),
      status: "SENT",
      discount: 120,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-DCHANA-1KG", quantity: 10 },
        { sku: "AST-DMASOOR-1KG", quantity: 8 },
        { sku: "AST-TISSUE-4", quantity: 6 },
      ],
    },
    {
      invoiceNumber: "AST-SI-260410",
      customerIndex: 6,
      date: daysAgo(18),
      dueDate: daysAgo(4),
      status: "PAID",
      discount: 90,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-COLA-15L", quantity: 15 },
        { sku: "AST-CHIPS-70", quantity: 20 },
        { sku: "AST-JELLY-6", quantity: 8 },
      ],
    },
    {
      invoiceNumber: "AST-SI-260414",
      customerIndex: 8,
      date: daysAgo(15),
      dueDate: daysAgo(1),
      status: "OVERDUE",
      discount: 0,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-LAUNDRY-1KG", quantity: 12 },
        { sku: "AST-FLOOR-1L", quantity: 8 },
        { sku: "AST-GLASS-500", quantity: 6 },
      ],
    },
    {
      invoiceNumber: "AST-SI-260418",
      customerIndex: 10,
      date: daysAgo(12),
      dueDate: daysAgo(-3),
      status: "SENT",
      discount: 150,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-DIAPER-M24", quantity: 5 },
        { sku: "AST-HANDWASH-500", quantity: 6 },
        { sku: "AST-TPASTE-120", quantity: 8 },
      ],
    },
    {
      invoiceNumber: "AST-SI-260421",
      customerIndex: 12,
      date: daysAgo(9),
      dueDate: daysAgo(-5),
      status: "PAID",
      discount: 0,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-BULB-12W", quantity: 10 },
        { sku: "AST-BATT-AA4", quantity: 12 },
        { sku: "AST-EXT-3S", quantity: 4 },
      ],
    },
    {
      invoiceNumber: "AST-SI-260424",
      customerIndex: 14,
      date: daysAgo(7),
      dueDate: daysAgo(-2),
      status: "PAID",
      discount: 220,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-THERMAL-R", quantity: 30 },
        { sku: "AST-TAPE-2IN", quantity: 18 },
        { sku: "AST-CARTON-M", quantity: 16 },
      ],
    },
    {
      invoiceNumber: "AST-SI-260427",
      customerIndex: 16,
      date: daysAgo(4),
      dueDate: daysAgo(6),
      status: "SENT",
      discount: 75,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-ROOH-800", quantity: 6 },
        { sku: "AST-FALOODA-800", quantity: 5 },
        { sku: "AST-NIMKO-200", quantity: 12 },
      ],
    },
    {
      invoiceNumber: "AST-SI-260429",
      customerIndex: 18,
      date: daysAgo(2),
      dueDate: daysAgo(10),
      status: "PAID",
      discount: 0,
      branchId: branches.karachi.id,
      items: [
        { sku: "AST-RICE-1KG", quantity: 15 },
        { sku: "AST-MILK-1L", quantity: 18 },
        { sku: "AST-COOKIE-OAT", quantity: 12 },
      ],
    },
  ];

  const salesInvoices = [] as Array<{ id: string; invoiceNumber: string }>;
  for (const seed of salesInvoiceSeeds) {
    const invoiceItems = seed.items.map((item) => {
      const product = products[item.sku];
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.unitPrice,
        total: product.unitPrice * item.quantity,
      };
    });

    const subtotal = sum(invoiceItems);
    const invoice = await prisma.salesInvoice.create({
      data: {
        organizationId: organization.id,
        branchId: seed.branchId,
        customerId: customers[seed.customerIndex].id,
        invoiceNumber: seed.invoiceNumber,
        status: seed.status,
        date: seed.date,
        dueDate: seed.dueDate,
        subtotal,
        discount: seed.discount,
        taxAmount: 0,
        totalAmount: subtotal - seed.discount,
        notes: "Retail and wholesale supply invoice for demo reporting.",
        items: {
          create: invoiceItems,
        },
      },
    });
    salesInvoices.push({ id: invoice.id, invoiceNumber: invoice.invoiceNumber });
  }

  const purchaseInvoiceSeeds = [
    {
      invoiceNumber: "AST-PI-260301",
      supplierIndex: 0,
      issueDate: daysAgo(32),
      status: "PAID",
      items: [
        { sku: "AST-RICE-5KG", quantity: 40 },
        { sku: "AST-RICE-1KG", quantity: 80 },
        { sku: "AST-SUGAR-1KG", quantity: 60 },
      ],
    },
    {
      invoiceNumber: "AST-PI-260305",
      supplierIndex: 1,
      issueDate: daysAgo(27),
      status: "PAID",
      items: [
        { sku: "AST-OIL-5L", quantity: 32 },
        { sku: "AST-GHEE-1KG", quantity: 45 },
      ],
    },
    {
      invoiceNumber: "AST-PI-260309",
      supplierIndex: 2,
      issueDate: daysAgo(23),
      status: "APPROVED",
      items: [
        { sku: "AST-DCHANA-1KG", quantity: 55 },
        { sku: "AST-DMASOOR-1KG", quantity: 50 },
      ],
    },
    {
      invoiceNumber: "AST-PI-260314",
      supplierIndex: 3,
      issueDate: daysAgo(18),
      status: "APPROVED",
      items: [
        { sku: "AST-COLA-15L", quantity: 70 },
        { sku: "AST-MANGO-1L", quantity: 60 },
        { sku: "AST-WATER-15L", quantity: 100 },
      ],
    },
    {
      invoiceNumber: "AST-PI-260319",
      supplierIndex: 4,
      issueDate: daysAgo(13),
      status: "PAID",
      items: [
        { sku: "AST-LAUNDRY-1KG", quantity: 45 },
        { sku: "AST-FLOOR-1L", quantity: 38 },
        { sku: "AST-TISSUE-4", quantity: 42 },
      ],
    },
    {
      invoiceNumber: "AST-PI-260323",
      supplierIndex: 5,
      issueDate: daysAgo(8),
      status: "APPROVED",
      items: [
        { sku: "AST-DIAPER-M24", quantity: 25 },
        { sku: "AST-HANDWASH-500", quantity: 30 },
        { sku: "AST-TPASTE-120", quantity: 35 },
      ],
    },
    {
      invoiceNumber: "AST-PI-260327",
      supplierIndex: 7,
      issueDate: daysAgo(5),
      status: "APPROVED",
      items: [
        { sku: "AST-THERMAL-R", quantity: 120 },
        { sku: "AST-BULB-12W", quantity: 40 },
        { sku: "AST-TAPE-2IN", quantity: 60 },
      ],
    },
  ];

  const purchaseInvoices = [] as Array<{ id: string; invoiceNumber: string }>;
  for (const seed of purchaseInvoiceSeeds) {
    const purchaseItems = seed.items.map((item) => {
      const product = products[item.sku];
      return {
        productId: product.id,
        quantity: item.quantity,
        unitCost: product.costPrice,
        total: product.costPrice * item.quantity,
      };
    });

    const subtotal = sum(purchaseItems);
    const purchaseInvoice = await prisma.purchaseInvoice.create({
      data: {
        organizationId: organization.id,
        branchId: branches.karachi.id,
        supplierId: suppliers[seed.supplierIndex].id,
        invoiceNumber: seed.invoiceNumber,
        status: seed.status,
        issueDate: seed.issueDate,
        dueDate: daysAgo(-(Math.abs(seed.issueDate.getDate() - new Date().getDate()) % 12)),
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        items: {
          create: purchaseItems,
        },
      },
    });
    purchaseInvoices.push({ id: purchaseInvoice.id, invoiceNumber: purchaseInvoice.invoiceNumber });
  }

  const expenses = [
    { description: "Monthly warehouse rent", amount: 85000, category: "Rent", date: daysAgo(25), accountId: accounts.bank.id },
    { description: "Electricity and utilities", amount: 28500, category: "Utilities", date: daysAgo(19), accountId: accounts.bank.id },
    { description: "Delivery van fuel", amount: 15200, category: "Transport", date: daysAgo(14), accountId: accounts.cash.id },
    { description: "Internet and POS subscriptions", amount: 11250, category: "Operations", date: daysAgo(9), accountId: accounts.bank.id },
    { description: "Staff refreshments and office supplies", amount: 6050, category: "Office", date: daysAgo(3), accountId: accounts.cash.id },
  ];

  const expenseRecords = [];
  for (const expense of expenses) {
    expenseRecords.push(
      await prisma.expense.create({
        data: {
          organizationId: organization.id,
          branchId: branches.karachi.id,
          accountId: expense.accountId,
          description: expense.description,
          amount: expense.amount,
          date: expense.date,
          category: expense.category,
        },
      })
    );
  }

  const payments = [
    {
      type: "IN",
      amount: 24840,
      date: daysAgo(20),
      paymentMethod: "Bank Transfer",
      referenceNumber: "IBFT-908221",
      accountId: accounts.bank.id,
      salesInvoiceId: salesInvoices[0].id,
      customerId: customers[0].id,
    },
    {
      type: "OUT",
      amount: 126000,
      date: daysAgo(16),
      paymentMethod: "Cheque",
      referenceNumber: "CHQ-441190",
      accountId: accounts.bank.id,
      purchaseInvoiceId: purchaseInvoices[1].id,
      supplierId: suppliers[1].id,
    },
    {
      type: "IN",
      amount: 18500,
      date: daysAgo(1),
      paymentMethod: "JazzCash",
      referenceNumber: "JC-771205",
      accountId: accounts.wallet.id,
      salesInvoiceId: salesInvoices[9].id,
      customerId: customers[18].id,
    },
  ];

  const paymentRecords = [];
  for (const payment of payments) {
    paymentRecords.push(
      await prisma.payment.create({
        data: {
          organizationId: organization.id,
          branchId: branches.karachi.id,
          accountId: payment.accountId,
          type: payment.type,
          amount: payment.amount,
          date: payment.date,
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          salesInvoiceId: payment.salesInvoiceId,
          purchaseInvoiceId: payment.purchaseInvoiceId,
          customerId: payment.customerId,
          supplierId: payment.supplierId,
        },
      })
    );
  }

  const ledgerEntries = [
    {
      branchId: branches.karachi.id,
      accountId: accounts.bank.id,
      amount: 1650000,
      balanceAfter: 1650000,
      description: "Opening balance transferred to Meezan Bank current account.",
      referenceType: "OPENING_BALANCE",
      referenceId: accounts.bank.id,
    },
    {
      branchId: branches.karachi.id,
      accountId: accounts.cash.id,
      amount: 250000,
      balanceAfter: 250000,
      description: "Opening balance for main cash counter.",
      referenceType: "OPENING_BALANCE",
      referenceId: accounts.cash.id,
    },
    {
      branchId: branches.karachi.id,
      accountId: accounts.bank.id,
      amount: payments[0].amount,
      balanceAfter: 1674840,
      description: "Customer payment received against AST-SI-260401.",
      referenceType: "PAYMENT",
      referenceId: paymentRecords[0].id,
    },
    {
      branchId: branches.karachi.id,
      accountId: accounts.bank.id,
      amount: -expenses[0].amount,
      balanceAfter: 1589840,
      description: "Warehouse rent paid for current month.",
      referenceType: "EXPENSE",
      referenceId: expenseRecords[0].id,
    },
    {
      branchId: branches.karachi.id,
      accountId: accounts.bank.id,
      amount: -payments[1].amount,
      balanceAfter: 1463840,
      description: "Supplier cheque issued against AST-PI-260305.",
      referenceType: "PAYMENT",
      referenceId: paymentRecords[1].id,
    },
    {
      branchId: branches.karachi.id,
      accountId: accounts.wallet.id,
      amount: 60000,
      balanceAfter: 60000,
      description: "Opening float for JazzCash collection wallet.",
      referenceType: "OPENING_BALANCE",
      referenceId: accounts.wallet.id,
    },
    {
      branchId: branches.karachi.id,
      accountId: accounts.wallet.id,
      amount: payments[2].amount,
      balanceAfter: 78500,
      description: "JazzCash recovery received from Safa Super Market.",
      referenceType: "PAYMENT",
      referenceId: paymentRecords[2].id,
    },
    {
      branchId: branches.karachi.id,
      accountId: accounts.cash.id,
      amount: -expenses[2].amount,
      balanceAfter: 234800,
      description: "Fuel expense booked for delivery van route.",
      referenceType: "EXPENSE",
      referenceId: expenseRecords[2].id,
    },
  ];

  await prisma.ledgerEntry.createMany({
    data: ledgerEntries.map((entry) => ({
      organizationId: organization.id,
      ...entry,
    })),
  });

  const darazChannel = await prisma.salesChannel.create({
    data: {
      organizationId: organization.id,
      name: "Daraz Pakistan",
      type: "DARAZ",
      credentialsEncrypted: encryptIntegrationCredentials({
        appKey: "daraz-demo-app-key",
        appSecret: "daraz-demo-app-secret",
        accessToken: "daraz-demo-access-token",
        refreshToken: "daraz-demo-refresh-token",
        sellerId: "al-sadiq-daraz-demo",
      }),
      configuration: JSON.stringify({
        apiBaseUrl: "https://api.daraz.com/rest",
        useMock: true,
        shopId: "alsadiq-daraz",
        region: "PK",
        defaultCategoryExternalId: "10000340",
        defaultAttributes: { brand: "Al Sadiq", warranty_type: "No Warranty" },
      }),
      lastSyncAt: daysAgo(1),
      syncStatus: "SUCCESS",
      isActive: true,
    },
  });

  const shopifyChannel = await prisma.salesChannel.create({
    data: {
      organizationId: organization.id,
      name: "Shopify Demo Store",
      type: "SHOPIFY",
      credentialsEncrypted: encryptIntegrationCredentials({
        shopDomain: "alsadiq-demo.myshopify.com",
        adminAccessToken: "shpat_demo_admin_token",
      }),
      configuration: JSON.stringify({
        shopDomain: "alsadiq-demo.myshopify.com",
        useMock: true,
        apiVersion: "2025-01",
      }),
      lastSyncAt: daysAgo(2),
      syncStatus: "SUCCESS",
      isActive: true,
    },
  });

  const wooChannel = await prisma.salesChannel.create({
    data: {
      organizationId: organization.id,
      name: "WooCommerce Demo Store",
      type: "WOOCOMMERCE",
      credentialsEncrypted: encryptIntegrationCredentials({
        storeUrl: "https://shop.alsadiq-demo.local",
        consumerKey: "ck_demo_alsadiq",
        consumerSecret: "cs_demo_alsadiq",
      }),
      configuration: JSON.stringify({
        storeUrl: "https://shop.alsadiq-demo.local",
        useMock: true,
      }),
      lastSyncAt: daysAgo(3),
      syncStatus: "SUCCESS",
      isActive: true,
    },
  });

  const mappedSkuGroups = {
    daraz: ["AST-RICE-5KG", "AST-OIL-5L", "AST-TEA-475G", "AST-DIAPER-M24"],
    shopify: ["AST-TISSUE-4", "AST-LAUNDRY-1KG", "AST-BULB-12W", "AST-THERMAL-R"],
    woo: ["AST-MILK-1L", "AST-COLA-15L", "AST-BISCUIT-SALT", "AST-TAPE-2IN"],
  };

  for (const sku of mappedSkuGroups.daraz) {
    const product = products[sku];
    await prisma.externalProductMap.create({
      data: {
        organizationId: organization.id,
        salesChannelId: darazChannel.id,
        productId: product.id,
        externalProductId: `daraz-${sku.toLowerCase()}`,
        externalSku: sku,
        externalTitle: product.name,
        syncStatus: "LINKED",
        metadata: JSON.stringify({
          quantity: product.lowStockThreshold + 1,
          price: product.unitPrice,
          categoryName: product.categoryName,
        }),
        lastSyncedAt: daysAgo(1),
      },
    });
  }

  for (const sku of mappedSkuGroups.shopify) {
    const product = products[sku];
    await prisma.externalProductMap.create({
      data: {
        organizationId: organization.id,
        salesChannelId: shopifyChannel.id,
        productId: product.id,
        externalProductId: `gid://shopify/Product/${sku}`,
        externalVariantId: `gid://shopify/ProductVariant/${sku}`,
        externalSku: sku,
        externalTitle: product.name,
        syncStatus: "LINKED",
        metadata: JSON.stringify({
          inventoryQuantity: product.lowStockThreshold - 1,
          price: product.unitPrice,
        }),
        lastSyncedAt: daysAgo(2),
      },
    });
  }

  for (const sku of mappedSkuGroups.woo) {
    const product = products[sku];
    await prisma.externalProductMap.create({
      data: {
        organizationId: organization.id,
        salesChannelId: wooChannel.id,
        productId: product.id,
        externalProductId: `woo-${sku.toLowerCase()}`,
        externalSku: sku,
        externalTitle: product.name,
        syncStatus: "LINKED",
        metadata: JSON.stringify({
          stockQuantity: product.lowStockThreshold + 6,
          price: product.unitPrice,
        }),
        lastSyncedAt: daysAgo(3),
      },
    });
  }

  await prisma.externalOrderMap.createMany({
    data: [
      {
        organizationId: organization.id,
        salesChannelId: darazChannel.id,
        salesInvoiceId: salesInvoices[0].id,
        externalOrderId: "DARAZ-778001",
        externalOrderNumber: "778001-PK",
        externalCustomerId: "daraz-customer-001",
        externalPaymentId: "daraz-pay-001",
        externalStatus: "delivered",
        paymentStatus: "paid",
        lastSyncedAt: daysAgo(1),
      },
      {
        organizationId: organization.id,
        salesChannelId: shopifyChannel.id,
        salesInvoiceId: salesInvoices[3].id,
        externalOrderId: "gid://shopify/Order/880012",
        externalOrderNumber: "#880012",
        externalCustomerId: "gid://shopify/Customer/700012",
        externalPaymentId: "gid://shopify/Payment/500012",
        externalStatus: "paid",
        paymentStatus: "paid",
        lastSyncedAt: daysAgo(2),
      },
      {
        organizationId: organization.id,
        salesChannelId: wooChannel.id,
        salesInvoiceId: salesInvoices[8].id,
        externalOrderId: "woo-order-4409",
        externalOrderNumber: "4409",
        externalCustomerId: "woo-customer-4409",
        externalPaymentId: "cod-4409",
        externalStatus: "processing",
        paymentStatus: "pending",
        lastSyncedAt: daysAgo(3),
      },
    ],
  });

  await prisma.salesChannelSyncLog.createMany({
    data: [
      {
        organizationId: organization.id,
        salesChannelId: darazChannel.id,
        direction: "INBOUND",
        entityType: "ORDERS",
        status: "SUCCESS",
        message: "Imported fresh Daraz marketplace orders for Karachi dispatch team.",
        startedAt: daysAgo(1),
        finishedAt: daysAgo(1),
      },
      {
        organizationId: organization.id,
        salesChannelId: darazChannel.id,
        direction: "OUTBOUND",
        entityType: "INVENTORY",
        status: "SUCCESS",
        message: "Pushed stock updates for top-selling staples to Daraz demo channel.",
        startedAt: daysAgo(1),
        finishedAt: daysAgo(1),
      },
      {
        organizationId: organization.id,
        salesChannelId: shopifyChannel.id,
        direction: "INBOUND",
        entityType: "PRODUCTS",
        status: "SUCCESS",
        message: "Synced Shopify demo catalogue into ERP product mapping.",
        startedAt: daysAgo(2),
        finishedAt: daysAgo(2),
      },
      {
        organizationId: organization.id,
        salesChannelId: wooChannel.id,
        direction: "INBOUND",
        entityType: "ORDERS",
        status: "SUCCESS",
        message: "Pulled WooCommerce retail orders and matched them to local customers.",
        startedAt: daysAgo(3),
        finishedAt: daysAgo(3),
      },
    ],
  });

  await prisma.importJob.createMany({
    data: [
      {
        organizationId: organization.id,
        fileName: "march-product-master.xlsx",
        importType: "PRODUCTS",
        status: "COMPLETED",
        totalRows: 60,
        successRows: 60,
        failedRows: 0,
        errorSummary: null,
        createdById: user.id,
        createdAt: daysAgo(12),
      },
      {
        organizationId: organization.id,
        fileName: "ramzan-orders-batch.csv",
        importType: "ORDERS",
        status: "PARTIAL",
        totalRows: 42,
        successRows: 38,
        failedRows: 4,
        errorSummary: "4 rows skipped because SKU mapping was missing.",
        createdById: user.id,
        createdAt: daysAgo(8),
      },
      {
        organizationId: organization.id,
        fileName: "supplier-directory-april.xlsx",
        importType: "SUPPLIERS",
        status: "COMPLETED",
        totalRows: 10,
        successRows: 10,
        failedRows: 0,
        errorSummary: null,
        createdById: user.id,
        createdAt: daysAgo(5),
      },
      {
        organizationId: organization.id,
        fileName: "branch-stock-adjustment.csv",
        importType: "INVENTORY",
        status: "FAILED",
        totalRows: 18,
        successRows: 0,
        failedRows: 18,
        errorSummary: "Stock file used an outdated SKU format from a vendor POS export.",
        createdById: user.id,
        createdAt: daysAgo(2),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        organizationId: organization.id,
        userId: user.id,
        type: "LOW_STOCK",
        severity: "WARNING",
        title: "Low Stock Watch",
        message: "Cooking Oil 5L and Tea 475g are below reorder level in Karachi Head Office.",
        actionUrl: "/inventory",
      },
      {
        organizationId: organization.id,
        userId: user.id,
        type: "SYSTEM",
        severity: "SUCCESS",
        title: "Daraz Demo Sync Complete",
        message: "Daraz demo orders and stock updates were synced successfully.",
        actionUrl: "/settings/integrations/daraz",
      },
      {
        organizationId: organization.id,
        userId: user.id,
        type: "SYSTEM",
        severity: "INFO",
        title: "Import Review Needed",
        message: "One inventory import failed because the file used legacy SKUs.",
        actionUrl: "/imports",
      },
    ],
  });

  console.log("Demo seed completed.");
  console.log(`Organization: ${ORG_NAME}`);
  console.log(`Login email: ${DEMO_EMAIL}`);
  console.log(`Login password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
