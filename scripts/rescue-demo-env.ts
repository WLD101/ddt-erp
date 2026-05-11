import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function run() {
  console.log("🔍 Initiating Demo Infrastructure Restoration...");
  
  const DEMO_EMAIL = "admin@alsadiq.local";
  const DEMO_PASS = "Demo123!";
  const ORG_NAME = "Al Sadiq Traders";

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASS, 12);
    
    // 1. Upsert the User
    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {
        name: "Demo Administrator",
        password: passwordHash,
        authStatus: "verified",
        verifiedAt: new Date(),
        isDemoUser: true,
      },
      create: {
        name: "Demo Administrator",
        email: DEMO_EMAIL,
        password: passwordHash,
        authStatus: "verified",
        verifiedAt: new Date(),
        isDemoUser: true,
      },
    });
    console.log(`✅ Demo user verified/provisioned: ${user.email}`);

    // 2. Upsert the Organization
    const org = await prisma.organization.upsert({
      where: { slug: "al-sadiq-traders" },
      update: {
        name: ORG_NAME,
        isDemoTenant: true,
        accessStatus: "active",
      },
      create: {
        name: ORG_NAME,
        slug: "al-sadiq-traders",
        currency: "PKR",
        country: "Pakistan",
        isDemoTenant: true,
        accessStatus: "active",
      },
    });
    console.log(`✅ Demo organization active: ${org.name} (id: ${org.id})`);

    // 3. Ensure 'Owner' role exists in DB
    const ownerRole = await prisma.role.findFirst({
      where: { name: "Owner" },
    });
    
    if (!ownerRole) {
       throw new Error("Missing database core seeding: 'Owner' role not found. Run prod-seed first.");
    }

    // 4. Link User to Org if not already
    const existingLink = await prisma.organizationUser.findFirst({
      where: {
        organizationId: org.id,
        userId: user.id,
      }
    });

    if (!existingLink) {
      await prisma.organizationUser.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: ownerRole.id,
        }
      });
      console.log("✅ Attached user to demo organization as Owner.");
    } else {
      console.log("✅ User linkage validated.");
    }

    console.log("\n🎉 SYSTEM RECOVERY COMPLETE. Demo login is fully functional.");
    
  } catch (err) {
    console.error("\n❌ FATAL ERROR during demo recovery:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
