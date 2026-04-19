import { prisma } from "@/lib/prisma";
import { LifecycleTemplates, StandardLifecycleTemplate } from "./templates";
import React from "react";


/**
 * MOCK EMAIL PROVIDER INTERFACE
 * Swap this out for Resend, SendGrid, or Postmark.
 */
async function sendEmailViaProvider(to: string, subject: string, html: string) {
  console.log("─────────────────────────────────────────────────────────────────────────────");
  console.log(`[MAILER] Dispatching to: ${to}`);
  console.log(`[MAILER] Subject: ${subject}`);
  console.log(`[MAILER] Body Preview: ${html.substring(0, 50)}...`);
  console.log("─────────────────────────────────────────────────────────────────────────────");
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { providerId: `mock_${Math.random().toString(36).substring(7)}` };
}

/**
 * CORE: Trigger a lifecycle email event for a user.
 * Ensures idempotency: will not send the same event twice to the same user.
 */
export async function triggerLifecycleEmail(userId: string, organizationId: string | null, event: keyof typeof LifecycleTemplates, customParams?: any) {
  // 1. Check if already sent
  const existing = await prisma.emailLog.findFirst({
    where: { userId, event }
  });

  if (existing) {
    console.log(`[Lifecycle] Skipping ${event} for user ${userId} - Already sent on ${existing.sentAt}`);
    return null;
  }

  // 2. Fetch User & Data
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return null;

  // 3. Resolve Template
  const templateFn = (LifecycleTemplates as any)[event];
  if (!templateFn) throw new Error(`Template for event ${event} not found.`);
  
  const templateData = templateFn(user.name || "User", customParams);
  
  // Dynamic import react-dom/server to stay within server-only bounds of the component graph
  const { renderToStaticMarkup } = await import("react-dom/server");
  const html = renderToStaticMarkup(<StandardLifecycleTemplate {...templateData} />);

  // 4. Send
  const { providerId } = await sendEmailViaProvider(user.email, templateData.subject, html);

  // 5. Log
  return prisma.emailLog.create({
    data: {
      userId,
      organizationId,
      event,
      subject: templateData.subject,
      providerId,
      emailType: "LIFECYCLE"
    }
  });
}

/**
 * OPERATIONAL SCAN: Find users reaching lifecycle milestones.
 * Designed to be called from the dashboard pulse or a cron job.
 */
export async function syncLifecycleMilestones() {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
  const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

  // A. Trial Ending (3 days left)
  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: "trialing",
      currentPeriodEnd: { lte: threeDaysFromNow, gt: now }
    },
    include: { organization: { include: { memberships: { include: { user: true } } } } }
  });

  for (const sub of expiringSoon) {
    const owner = sub.organization.memberships.find(m => m.roleId.includes("owner")); // Simple role check
    if (owner?.userId) {
        const daysLeft = Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        await triggerLifecycleEmail(owner.userId, sub.organizationId, "TRIAL_ENDING", daysLeft);
    }
  }

  // B. Trial Expired (Recently passed currentPeriodEnd)
  const expired = await prisma.subscription.findMany({
    where: {
      status: "trialing",
      currentPeriodEnd: { lte: now, gt: oneDayAgo }
    },
    include: { organization: { include: { memberships: { include: { user: true } } } } }
  });

  for (const sub of expired) {
     const owner = sub.organization.memberships.find(m => m.roleId.includes("owner"));
     if (owner?.userId) {
         await triggerLifecycleEmail(owner.userId, sub.organizationId, "TRIAL_EXPIRED");
     }
  }
}
