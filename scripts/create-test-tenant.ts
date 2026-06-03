import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const email = "testvoice@whatsquery.com";
  const password = await hash("WhatsQueryVoice2026!", 10);
  
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Voice Tester",
        email,
        password
      }
    });
  }

  const orgName = "Test Voice Cafe";
  let org = await prisma.organization.findFirst({ where: { name: orgName } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: orgName,
        slug: "test-voice-cafe",
        industryType: "retail"
      }
    });

    const role = await prisma.role.create({
      data: {
        name: "owner",
        organizationId: org.id
      }
    });

    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        roleId: role.id
      }
    });
  }

  let voiceProfile = await prisma.voiceBusinessProfile.findUnique({ where: { organizationId: org.id } });
  if (!voiceProfile) {
    voiceProfile = await prisma.voiceBusinessProfile.create({
      data: {
        organizationId: org.id,
        businessName: orgName,
        description: "A test cafe for Voice AI.",
        timezone: "Asia/Karachi",
        mainGoal: "book_appointments"
      }
    });
  }

  console.log("====================================");
  console.log("TEST TENANT CREATED SUCCESSFULLY");
  console.log("Login URL: https://voice.whatsquery.com/login");
  console.log("Email: " + email);
  console.log("Password: WhatsQueryVoice2026!");
  console.log("Organization: " + orgName);
  console.log("====================================");
}

main().catch(console.error).finally(() => prisma.$disconnect());
