import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const ONBOARDING_QUEUE = "onboarding_tasks";
export const EMAIL_QUEUE = "email_tasks";

export const onboardingQueue = new Queue(ONBOARDING_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const emailQueue = new Queue(EMAIL_QUEUE, {
  connection: redis,
});
