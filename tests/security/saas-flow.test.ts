import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { addDays, subDays } from "date-fns";
import { prisma } from "../../lib/prisma";
import { getOrganizationAccessState } from "../../lib/billing/access";
import { verifyOtp } from "../../modules/otp/service";
import { GET as blockedCustomerExport } from "../../app/api/export/customers/route";
import { getTenantStore } from "../../lib/db/client";
import { createSalesInvoice } from "../../modules/sales/service";

let dbAvailable: boolean | null = null;

function hashOtp(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function ensureDatabaseOrSkip(t: { skip: (message: string) => void }) {
  if (dbAvailable === null) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbAvailable = true;
    } catch {
      dbAvailable = false;
    }
  }

  if (!dbAvailable) {
    t.skip("Database server is not available for integration-backed security checks.");
    return false;
  }

  return true;
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
          billingCycle: "MONTHLY",
          billingSource: "manual",
          currentPeriodStart: subDays(new Date(), 1),
          currentPeriodEnd: addDays(new Date(), 20),
        },
      },
    },
  });
}

async function createSalesFixture(prefix: string) {
  const organization = await createOrg(prefix, "active");
  const branch = await prisma.branch.create({
    data: {
      organizationId: organization.id,
      name: `${prefix} HQ`,
      isMain: true,
    },
  });
  const customer = await prisma.customer.create({
    data: {
      organizationId: organization.id,
      name: `${prefix} Customer`,
      email: `${prefix}-customer@example.com`,
    },
  });
  const product = await prisma.product.create({
    data: {
      organizationId: organization.id,
      name: `${prefix} Product`,
      sku: `${prefix.toUpperCase()}-${Date.now()}`,
      unitPrice: 25,
      costPrice: 10,
      lowStockThreshold: 1,
    },
  });

  return {
    organization,
    branch,
    customer,
    product,
    db: getTenantStore({
      userId: "security-test-user",
      organizationId: organization.id,
      branchId: branch.id,
      role: "owner",
      permissions: ["sales.create"],
    }),
  };
}

test("manual paid subscription keeps ERP access active", async (t) => {
  if (!(await ensureDatabaseOrSkip(t))) return;
  const org = await createOrg("manual-paid", "active");
  await prisma.subscription.update({
    where: { organizationId: org.id },
    data: {
      paymentStatus: "paid",
      billingSource: "manual",
      manualPaymentMethod: "BANK_TRANSFER",
      manualPaymentReference: "BANK-REF-001",
    },
  });

  try {
    const state = await getOrganizationAccessState(org.id);
    assert.equal(state.status, "active");
    assert.equal(state.redirectTo, undefined);
  } finally {
    await prisma.organization.delete({ where: { id: org.id } });
  }
});

test("paid user cannot access ERP before payment succeeds", async (t) => {
  if (!(await ensureDatabaseOrSkip(t))) return;
  const org = await createOrg("payment-pending", "payment_pending");
  try {
    const state = await getOrganizationAccessState(org.id);
    assert.equal(state.status, "payment_pending");
    assert.equal(state.redirectTo, "/onboarding/packages");
  } finally {
    await prisma.organization.delete({ where: { id: org.id } });
  }
});

test("expired paid subscription enters 15 day grace and keeps data", async (t) => {
  if (!(await ensureDatabaseOrSkip(t))) return;
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

test("expired demo is blocked without deleting tenant data", async (t) => {
  if (!(await ensureDatabaseOrSkip(t))) return;
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

test("cancelled subscription is blocked and sent to billing", async (t) => {
  if (!(await ensureDatabaseOrSkip(t))) return;
  const org = await createOrg("cancelled", "active");
  await prisma.subscription.update({
    where: { organizationId: org.id },
    data: {
      status: "cancelled",
      paymentStatus: "paid",
      billingSource: "manual",
    },
  });

  try {
    const state = await getOrganizationAccessState(org.id);
    assert.equal(state.status, "blocked");
    assert.equal(state.redirectTo, "/settings/billing");
  } finally {
    await prisma.organization.delete({ where: { id: org.id } });
  }
});

test("wrong OTP increments attempts and expired OTP fails", async (t) => {
  if (!(await ensureDatabaseOrSkip(t))) return;
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
    const wrong = await verifyOtp({ email, purpose: "DEMO_SIGNUP", code: "111111" });
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

test("sales invoices cannot drive inventory below zero", async (t) => {
  if (!(await ensureDatabaseOrSkip(t))) return;
  const fixture = await createSalesFixture("stock-guard");

  await prisma.inventoryItem.create({
    data: {
      organizationId: fixture.organization.id,
      branchId: fixture.branch.id,
      productId: fixture.product.id,
      quantity: 1,
      location: "Primary Shelf",
    },
  });

  try {
    await assert.rejects(
      createSalesInvoice(fixture.db as any, fixture.branch.id, {
        customerId: fixture.customer.id,
        invoiceNumber: `INV-STOCK-${Date.now()}`,
        items: [
          {
            productId: fixture.product.id,
            quantity: 2,
            unitPrice: 25,
          },
        ],
        discount: 0,
        notes: "Negative inventory prevention test",
      }),
      /Insufficient stock/
    );

    const inventory = await prisma.inventoryItem.findUniqueOrThrow({
      where: {
        organizationId_branchId_productId: {
          organizationId: fixture.organization.id,
          branchId: fixture.branch.id,
          productId: fixture.product.id,
        },
      },
    });
    const invoiceCount = await prisma.salesInvoice.count({
      where: { organizationId: fixture.organization.id },
    });

    assert.equal(inventory.quantity, 1);
    assert.equal(invoiceCount, 0);
  } finally {
    await prisma.organization.delete({ where: { id: fixture.organization.id } });
  }
});

test("tenant direct export route is blocked without an approved export request", async () => {
  const response = await blockedCustomerExport();
  assert.equal(response.status, 403);
});
