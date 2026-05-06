import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding platform data...");

  // 1. Seed Permissions
  const permissions = [
    { name: "inventory.view", category: "Inventory" },
    { name: "inventory.write", category: "Inventory" },
    { name: "sales.view", category: "Sales" },
    { name: "sales.write", category: "Sales" },
    { name: "purchases.view", category: "Purchases" },
    { name: "purchases.write", category: "Purchases" },
    { name: "finance.view", category: "Finance" },
    { name: "finance.write", category: "Finance" },
    { name: "users.view", category: "Users" },
    { name: "users.write", category: "Users" },
    { name: "reports.view", category: "Reports" },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { category: p.category },
      create: { name: p.name, category: p.category },
    });
  }

  // 2. Industry Specific Setup
  const industries = [
    { id: "textile", name: "Textile ERP" },
    { id: "manufacturing", name: "Manufacturing ERP" },
    { id: "retail", name: "Retail ERP" },
  ];

  // In this architecture, industries are logical groupings.
  // We can pre-define module sets for them.
  console.log("Industries defined:", industries.map(i => i.name).join(", "));

  // 3. Global Roles (Templates)
  // These will be cloned per organization during bootstrap.
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
