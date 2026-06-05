const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAsst() {
  const user = await prisma.user.findUnique({
    where: { email: 'testvoice@whatsquery.com' }
  });
  
  const orgUsers = await prisma.organizationUser.findMany({
    where: { userId: user.id }
  });
  const orgId = orgUsers[0]?.organizationId;
  
  const agent = await prisma.voiceAgent.findFirst({
    where: { organizationId: orgId }
  });
  console.log("ASSISTANT_ID:", agent ? agent.vapiAssistantId : "NONE");
}

getAsst().catch(console.error).finally(() => prisma.$disconnect());
