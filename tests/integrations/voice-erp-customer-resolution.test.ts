import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeVoiceEmail,
  normalizeVoicePhone,
  resolveVoiceCustomer,
} from "@/modules/voice/erp/customer-resolution";

function createDbStub(input: {
  organizationId?: string;
  phoneMatches?: Array<Record<string, any>>;
  emailMatches?: Array<Record<string, any>>;
  createdCustomers?: Array<Record<string, any>>;
  updatedCustomers?: Array<Record<string, any>>;
}) {
  const createdCustomers = input.createdCustomers ?? [];
  const updatedCustomers = input.updatedCustomers ?? [];

  return {
    organizationId: input.organizationId ?? "org-a",
    customer: {
      findMany: async ({ where }: Record<string, any>) => {
        if (where.phone) return input.phoneMatches ?? [];
        if (where.email) return input.emailMatches ?? [];
        return [];
      },
      create: async ({ data }: Record<string, any>) => {
        const record = { id: `cust-${createdCustomers.length + 1}`, ...data };
        createdCustomers.push(record);
        return record;
      },
      update: async ({ where, data }: Record<string, any>) => {
        const record = { id: where.id, ...data };
        updatedCustomers.push(record);
        return record;
      },
    },
  } as any;
}

test("normalizes supported customer phone and email formats", () => {
  assert.equal(normalizeVoicePhone("+44 20 7946 0018", "uk"), "+442079460018");
  assert.equal(normalizeVoicePhone("0300 1234567", "pk"), "+923001234567");
  assert.equal(normalizeVoiceEmail(" Sales@Example.COM "), "sales@example.com");
});

test("resolves an existing customer by phone within the tenant", async () => {
  const db = createDbStub({
    phoneMatches: [{ id: "cust-1", name: "A", phone: "+923001234567", email: null, address: null }],
  });

  const result = await resolveVoiceCustomer(db, {
    name: "Caller A",
    phone: "0300 1234567",
    customerConfirmed: true,
  }, { marketKey: "pk" });

  assert.equal(result.status, "existing_customer");
  if (result.status === "existing_customer") {
    assert.equal(result.customerId, "cust-1");
    assert.equal(result.matchedBy, "phone");
  }
});

test("creates a new tenant customer only after confirmed identity exists", async () => {
  const created: Array<Record<string, any>> = [];
  const db = createDbStub({ createdCustomers: created });

  const result = await resolveVoiceCustomer(db, {
    name: "Farah Khan",
    phone: "+44 20 7946 0018",
    email: "farah@example.com",
    customerConfirmed: true,
  }, { marketKey: "uk" });

  assert.equal(result.status, "created_customer");
  assert.equal(created.length, 1);
  assert.equal(created[0].phone, "+442079460018");
  assert.equal(created[0].email, "farah@example.com");
});

test("same phone in two tenants is isolated by the scoped store", async () => {
  const tenantA = createDbStub({
    organizationId: "org-a",
    phoneMatches: [{ id: "cust-a", name: "Tenant A", phone: "+923001234567", email: null, address: null }],
  });
  const tenantB = createDbStub({
    organizationId: "org-b",
    phoneMatches: [{ id: "cust-b", name: "Tenant B", phone: "+923001234567", email: null, address: null }],
  });

  const resultA = await resolveVoiceCustomer(tenantA, {
    name: "Caller",
    phone: "0300 1234567",
    customerConfirmed: true,
  }, { marketKey: "pk" });
  const resultB = await resolveVoiceCustomer(tenantB, {
    name: "Caller",
    phone: "0300 1234567",
    customerConfirmed: true,
  }, { marketKey: "pk" });

  assert.equal(resultA.status, "existing_customer");
  assert.equal(resultB.status, "existing_customer");
  if (resultA.status === "existing_customer" && resultB.status === "existing_customer") {
    assert.equal(resultA.customerId, "cust-a");
    assert.equal(resultB.customerId, "cust-b");
  }
});

test("returns conflict when phone and email point to different tenant customers", async () => {
  const db = createDbStub({
    phoneMatches: [{ id: "cust-1", name: "One", phone: "+923001234567", email: null, address: null }],
    emailMatches: [{ id: "cust-2", name: "Two", phone: null, email: "one@example.com", address: null }],
  });

  const result = await resolveVoiceCustomer(db, {
    name: "Caller",
    phone: "0300 1234567",
    email: "one@example.com",
    customerConfirmed: true,
  }, { marketKey: "pk" });

  assert.equal(result.status, "conflict");
});

test("requires more information before creating an unconfirmed customer", async () => {
  const db = createDbStub({});

  const result = await resolveVoiceCustomer(db, {
    name: "Unconfirmed Caller",
    phone: "0300 1234567",
    customerConfirmed: false,
  }, { marketKey: "pk" });

  assert.equal(result.status, "needs_information");
});
