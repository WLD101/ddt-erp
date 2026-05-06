import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  const email = "admin@alsadiq.local";
  const password = "Demo123!";

  console.log("Checking for user in DB...");
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    console.log("User not found!");
    process.exit(1);
  }
  console.log("Found user:", user.id, user.email);

  if (!user.password) {
    console.log("User has no password!");
    process.exit(1);
  }

  const isValid = await bcrypt.compare(password, user.password);
  console.log("Is password valid?", isValid);
  
  const orgUsers = await prisma.organizationUser.findMany({ where: { userId: user.id } });
  console.log("Organizations user belongs to:", orgUsers);
}

test().catch(console.error).finally(() => prisma.$disconnect());
