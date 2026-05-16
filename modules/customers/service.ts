import { ScopedPrisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { contactSchema } from "@/lib/validations/common";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ...contactSchema,
  status: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export async function getCustomers(db: ScopedPrisma) {
  const customers = await db.customer.findMany({
    include: { salesInvoices: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => {
    const totalInvoiced = c.salesInvoices.reduce(
      (acc, inv) => acc + inv.totalAmount,
      0
    );
    const totalPaid = c.payments
      .filter((p) => p.type === "IN")
      .reduce((acc, p) => acc + p.amount, 0);
    return { ...c, balance: totalInvoiced - totalPaid };
  });
}

export async function getCustomerById(db: ScopedPrisma, id: string) {
  return db.customer.findUnique({
    where: { id },
    include: { salesInvoices: true, payments: true },
  });
}

export async function createCustomer(db: ScopedPrisma, data: CustomerInput) {
  const payload: Prisma.CustomerUncheckedCreateInput = {
    organizationId: db.organizationId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    status: data.status?.trim() || "ACTIVE",
  };

  return db.customer.create({
    data: payload,
  });
}

export async function updateCustomer(db: ScopedPrisma, id: string, data: CustomerInput) {
  const payload: Prisma.CustomerUncheckedUpdateInput = {
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    ...(typeof data.status !== "undefined" ? { status: data.status?.trim() || "ACTIVE" } : {}),
  };

  return db.customer.update({
    where: { id },
    data: payload,
  });
}

export async function deleteCustomer(db: ScopedPrisma, id: string) {
  return db.customer.delete({
    where: { id },
  });
}
