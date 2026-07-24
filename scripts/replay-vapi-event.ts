import { prisma } from "../lib/prisma";
import { replayVapiWebhookEvent } from "../modules/voice/jobs/service";

async function main() {
  const eventId = process.argv.find((value) => value.startsWith("--event="))?.slice("--event=".length);
  if (!eventId) throw new Error("Usage: npm run voice:replay-vapi -- --event=<VoiceWebhookEvent ID>");
  const result = await replayVapiWebhookEvent(eventId);
  console.log(JSON.stringify({ replayQueued: true, ...result }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Vapi event replay failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
