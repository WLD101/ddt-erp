import { Worker } from "bullmq";
import { redis } from "./lib/redis";
import { ONBOARDING_QUEUE, EMAIL_QUEUE } from "./lib/queue/client";

console.log("🚀 Starting BullMQ Workers...");

// Onboarding Worker
const onboardingWorker = new Worker(
  ONBOARDING_QUEUE,
  async (job) => {
    console.log(`[Onboarding] Processing job ${job.id} for organization ${job.data.organizationId}`);
    // Simulate complex setup tasks
    await new Promise((r) => setTimeout(r, 5000));
    console.log(`[Onboarding] Completed job ${job.id}`);
  },
  { connection: redis }
);

// Email Worker
const emailWorker = new Worker(
  EMAIL_QUEUE,
  async (job) => {
    console.log(`[Email] Sending ${job.data.type} to ${job.data.email}`);
    // Integrates with existing email service logic later
  },
  { connection: redis }
);

onboardingWorker.on("failed", (job, err) => {
  console.error(`[Onboarding] Job ${job?.id} failed:`, err);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Email] Job ${job?.id} failed:`, err);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await onboardingWorker.close();
  await emailWorker.close();
});
