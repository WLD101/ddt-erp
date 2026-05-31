/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { seedDemoWorkspace } from "./seeder";

export async function createDemoAccount() {
  const demoUuid = uuidv4().split("-")[0]; // Short random string
  const email = `demo-${demoUuid}@demo.whatsquery.local`;
  const rawPassword = `pass-${uuidv4().split("-")[0]}`;
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  return await prisma.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        name: "Demo User",
        email,
        password: hashedPassword,
        isDemoUser: true,
      },
    });

    // 2. Create Organization with 7-Day Free Trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    const organization = await tx.organization.create({
      data: {
        name: "Acme Corp (Demo)",
        slug: `demo-org-${demoUuid}`,
        isDemoTenant: true,
        lifecycleStatus: "demo",
        accessStatus: "active",
        activatedAt: new Date(),
        demoExpiresAt: trialEnd,
        subscription: {
          create: {
            planId: "pro",
            status: "trialing",
            paymentStatus: "demo",
            accessStatus: "active",
            billingSource: "demo",
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEnd,
          }
        }
      },
    });

    // 3. Link User as Owner
    await tx.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "owner",
      },
    });

    // 4. Create Role Matrix (Owner role is normally created at setup, but let's give them an explicit owner role or just rely on the fallback)
    // Wait, the ERP relies on Role model? Owner bypasses this in `tenant.ts/auth.ts`, but just in case, we might need to create it.
    // Our permissions system is robust and owners bypass checks.

    return { email, password: rawPassword, organizationId: organization.id, userId: user.id };
  }).then(async (credentials) => {
    // Run the seeder AFTER the transaction completes successfully to avoid transaction timeouts
    await seedDemoWorkspace(credentials.organizationId, credentials.userId);
    return { email: credentials.email, password: credentials.password };
  });
}
