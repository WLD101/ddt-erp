import { prisma } from "@/lib/prisma";
import { LifecycleTemplates, StandardLifecycleTemplate } from "./templates";
import React from "react";

export type EmailProviderPayload = {
  to: string;
  subject: string;
  html: string;
};

export interface EmailProvider {
  send(payload: EmailProviderPayload): Promise<{ providerId: string }>;
}

function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase() || "console";

  if (provider !== "console") {
    console.warn(`[Mailer] EMAIL_PROVIDER=${provider} is not configured. Falling back to console provider.`);
  }

  return {
    async send(payload) {
      console.log(`[MAILER:console] queued "${payload.subject}" for ${payload.to}`);
      return { providerId: `console_${Date.now()}` };
    },
  };
}

export async function sendTransactionalEmail(payload: EmailProviderPayload) {
  return getEmailProvider().send(payload);
}

/**
 * CORE: Trigger a lifecycle email event for a user.
 * Ensures idempotency: will not send the same event twice to the same user.
 */
export async function triggerLifecycleEmail(
  userId: string,
  organizationId: string | null,
  event: keyof typeof LifecycleTemplates,
  customParams?: unknown
) {
  const existing = await prisma.emailLog.findFirst({
    where: { userId, event },
  });

  if (existing) {
    console.log(`[Lifecycle] Skipping ${event} for user ${userId} - already sent.`);
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return null;

  const templateFn = (LifecycleTemplates as Record<string, any>)[event];
  if (!templateFn) throw new Error(`Template for event ${event} not found.`);

  const templateData = templateFn(user.name || "User", customParams);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const html = renderToStaticMarkup(<StandardLifecycleTemplate {...templateData} />);

  const { providerId } = await getEmailProvider().send({
    to: user.email,
    subject: templateData.subject,
    html,
  });

  return prisma.emailLog.create({
    data: {
      userId,
      organizationId,
      event,
      subject: templateData.subject,
      providerId,
      emailType: "LIFECYCLE",
    },
  });
}

/**
 * OPERATIONAL SCAN: Find users reaching lifecycle milestones.
 * Designed to be called from the dashboard pulse or a cron job.
 */
export async function syncLifecycleMilestones() {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: "trialing",
      currentPeriodEnd: { lte: threeDaysFromNow, gt: now },
    },
    include: {
      organization: {
        include: {
          memberships: { include: { user: true, role: true } },
        },
      },
    },
  });

  for (const sub of expiringSoon) {
    const owner = sub.organization.memberships.find((membership) => membership.role.name === "owner");
    if (owner?.userId) {
      const daysLeft = Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      await triggerLifecycleEmail(owner.userId, sub.organizationId, "TRIAL_ENDING", daysLeft);
    }
  }

  const expired = await prisma.subscription.findMany({
    where: {
      status: "trialing",
      currentPeriodEnd: { lte: now, gt: oneDayAgo },
    },
    include: {
      organization: {
        include: {
          memberships: { include: { user: true, role: true } },
        },
      },
    },
  });

  for (const sub of expired) {
    const owner = sub.organization.memberships.find((membership) => membership.role.name === "owner");
    if (owner?.userId) {
      await triggerLifecycleEmail(owner.userId, sub.organizationId, "TRIAL_EXPIRED");
    }
  }
}
