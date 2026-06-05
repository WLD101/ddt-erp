const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'testvoice@whatsquery.com' }
  });
  
  if (!user) return console.log("User testvoice@whatsquery.com NOT FOUND");
  
  const orgUsers = await prisma.organizationUser.findMany({
    where: { userId: user.id },
    include: { organization: true }
  });
  const orgId = orgUsers[0]?.organizationId;
  if (!orgId) return console.log("No organization");
  
  const pkg = await prisma.organizationPackage.findUnique({
    where: { organizationId: orgId },
    include: { package: true }
  });
  
  console.log("Package:", pkg ? pkg.package.name : "NONE");
  
  const agent = await prisma.voiceAgent.findFirst({
    where: { organizationId: orgId }
  });
  console.log("VoiceAgent:", agent ? agent.name : "NONE");
  
  const profile = await prisma.businessProfile.findUnique({
    where: { organizationId: orgId }
  });
  console.log("BusinessProfile:", profile ? profile.businessName : "NONE");
}

check().catch(console.error).finally(() => prisma.$disconnect());
