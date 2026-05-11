import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedPermissions } from "../lib/security/seed";
import { getBootstrapAdminPassword } from "../lib/security/env";

const prisma = new PrismaClient();

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
const ADMIN_PASSWORD = getBootstrapAdminPassword();

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

async function ensureAdminUser() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  console.log(`🌱 Ensuring platform admin: ${ADMIN_EMAIL}`);

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

async function main() {
  console.log("🚀 Starting Production Seed...");
  
  await seedPermissions();
  await seedPackages();
  await ensureAdminUser();
  
  console.log("✅ Production seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
