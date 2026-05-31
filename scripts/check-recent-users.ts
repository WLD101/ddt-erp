import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      authStatus: true,
      isDemoUser: true,
      createdAt: true,
    }
  });

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      slug: true,
      lifecycleStatus: true,
      isDemoTenant: true,
      createdAt: true,
    }
  });

  const otps = await prisma.oTPCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      email: true,
      purpose: true,
      createdAt: true,
      expiresAt: true,
    }
  }).catch(() => []);

  console.log("--- RECENT USERS ---");
  console.log(JSON.stringify(users, null, 2));
  
  console.log("\n--- RECENT ORGANIZATIONS ---");
  console.log(JSON.stringify(organizations, null, 2));

  console.log("\n--- RECENT OTPS ---");
  console.log(JSON.stringify(otps, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
