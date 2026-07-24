import { PrismaClient } from '@prisma/client';
import { syncVoiceTrainingPromptToVapi } from './modules/voice/training/service';

const prisma = new PrismaClient();

async function main() {
  const requiredEnv = ["VAPI_PRIVATE_API_KEY", "VAPI_WEBHOOK_SECRET", "VOICE_PUBLIC_APP_URL"];
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);
  if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  }
  
  const org = await prisma.organization.findFirst({ where: { name: 'Test Voice Cafe' } });
  if (!org) throw new Error('Org not found');
  
  console.log('Found org:', org.id);
  const result = await syncVoiceTrainingPromptToVapi(org.id);
  console.log('Sync Result:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
