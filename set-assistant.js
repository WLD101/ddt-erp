const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setAsst() {
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
  
  if (agent) {
    await prisma.voiceAgent.update({
      where: { id: agent.id },
      data: { vapiAssistantId: "assist_123" }
    });
    console.log("Updated agent with assist_123");
  } else {
    console.log("No agent found");
  }
}

setAsst().catch(console.error).finally(() => prisma.$disconnect());
