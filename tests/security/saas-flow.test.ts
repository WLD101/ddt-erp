import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { addDays, subDays } from "date-fns";
import { prisma } from "../../lib/prisma";
import { getOrganizationAccessState } from "../../lib/billing/access";
import { verifyOtp } from "../../modules/otp/service";
import { GET as blockedCustomerExport } from "../../app/api/export/customers/route";

function hashOtp(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function createOrg(prefix: string, accessStatus = "active") {
  return prisma.organization.create({
    data: {
      name: `${prefix} Org`,
      slug: `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      accessStatus,
      lifecycleStatus: accessStatus,
      subscription: {
        create: {
          planId: "security-test",
          status: accessStatus,
          paymentStatus: accessStatus === "active" ? "active" : "payment_pending",
          accessStatus,
          currentPeriodStart: subDays(new Date(), 1),
          currentPeriodEnd: addDays(new Date(), 20),
        },
      },
    },
  });
}

test("paid user cannot access ERP before payment succeeds", async () => {
  const org = await createOrg("payment-pending", "payment_pending");
  try {
    const state = await getOrganizationAccessState(org.id);
    assert.equal(state.status, "payment_pending");
    assert.equal(state.redirectTo, "/onboarding/packages");
  } finally {
    await prisma.organization.delete({ where: { id: org.id } });
  }
});

test("expired paid subscription enters 15 day grace and keeps data", async () => {
  const org = await createOrg("grace", "active");
  await prisma.customer.create({
    data: { organizationId: org.id, name: "Retained Customer", email: "retained@example.com" },
  });
  await prisma.subscription.update({
    where: { organizationId: org.id },
    data: { currentPeriodEnd: subDays(new Date(), 1), paymentStatus: "active", status: "active", accessStatus: "active" },
  });

  try {
    const state = await getOrganizationAccessState(org.id);
    const retained = await prisma.customer.count({ where: { organizationId: org.id } });
    assert.equal(state.status, "grace_period");
    assert.equal(retained, 1);
  } finally {
    await prisma.organization.delete({ where: { id: org.id } });
  }
});

test("expired demo is blocked without deleting tenant data", async () => {
  const org = await createOrg("demo-expired", "active");
  await prisma.organization.update({
    where: { id: org.id },
    data: { isDemoTenant: true, demoExpiresAt: subDays(new Date(), 1) },
  });
  await prisma.customer.create({
    data: { organizationId: org.id, name: "Demo Customer", email: "demo-customer@example.com" },
  });

  try {
    const state = await getOrganizationAccessState(org.id);
    const retained = await prisma.customer.count({ where: { organizationId: org.id } });
    assert.equal(state.status, "expired");
    assert.equal(retained, 1);
  } finally {
    await prisma.organization.delete({ where: { id: org.id } });
  }
});

test("wrong OTP increments attempts and expired OTP fails", async () => {
  const email = `otp-${Date.now()}@example.com`;
  const expiredEmail = `otp-expired-${Date.now()}@example.com`;
  await prisma.otpVerification.create({
    data: {
      email,
      purpose: "DEMO_SIGNUP",
      codeHash: hashOtp("123456"),
      expiresAt: addDays(new Date(), 1),
      lastSentAt: new Date(),
    },
  });
  await prisma.otpVerification.create({
    data: {
      email: expiredEmail,
      purpose: "PAID_SIGNUP",
      codeHash: hashOtp("999999"),
      expiresAt: subDays(new Date(), 1),
      lastSentAt: subDays(new Date(), 1),
    },
  });

  try {
    const wrong = await verifyOtp({ email, purpose: "DEMO_SIGNUP", code: "000000" });
    const record = await prisma.otpVerification.findFirstOrThrow({ where: { email } });
    const expired = await verifyOtp({ email: expiredEmail, purpose: "PAID_SIGNUP", code: "999999" });
    assert.equal(wrong.ok, false);
    assert.equal(record.attemptCount, 1);
    assert.equal(expired.ok, false);
    assert.equal(expired.error, "OTP expired.");
  } finally {
    await prisma.otpVerification.deleteMany({ where: { email: { in: [email, expiredEmail] } } });
  }
});

test("tenant direct export route is blocked without an approved export request", async () => {
  const response = await blockedCustomerExport();
  assert.equal(response.status, 403);
});
