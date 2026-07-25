import { processIntegrationEvents, processIntegrationSyncJobs } from "@/modules/integrations/runtime-worker";

async function main() {
  const [sync, events] = await Promise.all([
    processIntegrationSyncJobs(),
    processIntegrationEvents(),
  ]);

  console.log(
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        sync,
        events,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[integration-worker] failed", error);
  process.exitCode = 1;
});
