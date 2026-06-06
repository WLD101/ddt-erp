import { PrismaClient } from '@prisma/client';
import { syncVoiceTrainingPromptToVapi } from './modules/voice/training/service';

const prisma = new PrismaClient();

async function main() {
  process.env.VAPI_PRIVATE_API_KEY = '963fa96a-4ebc-4eb0-9979-c010cf541756';
  process.env.VAPI_WEBHOOK_SECRET = 'wq_sec_vapi_92h4k29fk390fj309';
  process.env.VOICE_PUBLIC_APP_URL = 'https://voice.whatsquery.com';
  
  const org = await prisma.organization.findFirst({ where: { name: 'Test Voice Cafe' } });
  if (!org) throw new Error('Org not found');
  
  console.log('Found org:', org.id);
  const result = await syncVoiceTrainingPromptToVapi(org.id);
  console.log('Sync Result:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
