import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "testvoice@whatsquery.com";
  const plainPassword = "WhatsQueryVoice2026!";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Update or create the user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
    },
    create: {
      email,
      name: "Voice Tester",
      password: hashedPassword,
    },
  });

  console.log(`Successfully updated password for ${user.email} to: ${plainPassword}`);
}

main().finally(() => prisma.$disconnect());
