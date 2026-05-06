import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const orgs = await p.organization.findMany({
  select: { id: true, accessStatus: true, isDemoTenant: true, demoExpiresAt: true, blockedAt: true, lifecycleStatus: true },
  orderBy: { createdAt: 'asc' }
});
console.log(JSON.stringify(orgs, null, 2));

const subs = await p.subscription.findMany({
  select: { organizationId: true, status: true, accessStatus: true, paymentStatus: true, currentPeriodEnd: true }
});
console.log("Subscriptions:", JSON.stringify(subs, null, 2));

await p.$disconnect();
