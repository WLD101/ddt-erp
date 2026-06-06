const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agent = await prisma.voiceAgent.findFirst({
    where: { organization: { name: 'Test Voice Cafe' } },
    include: { organization: true },
  });
  if (!agent) { console.log('No agent'); return; }
  console.log('Found agent:', agent.id, 'for org:', agent.organizationId);
  // We cannot easily require the TS files without ts-node/tsx configured for Next.js.
  // Instead, let's just make an HTTP POST to the backend route or server action endpoint if possible.
  // But wait, it's authenticated.
  console.log('Need a way to sync Vapi assistant ID');
}
main();
