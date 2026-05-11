import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getBootstrapAdminPassword } from "../lib/security/env";

const prisma = new PrismaClient();

function getBootstrapAdminEmail() {
  const emails = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((candidate) => candidate.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length > 0) {
    return emails[0];
  }

  return "admin@whatsquery.com";
}

async function main() {
  const email = getBootstrapAdminEmail();
  const password = getBootstrapAdminPassword();
  const hashedPassword = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, authStatus: "verified" },
    });
    console.log(`Updated user ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        name: "WhatsQuery Admin",
        password: hashedPassword,
        authStatus: "verified",
        emailVerified: new Date(),
        verifiedAt: new Date(),
      },
    });
    console.log(`Created user ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
