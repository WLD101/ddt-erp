import { ScopedPrisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { contactSchema } from "@/lib/validations/common";

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ...contactSchema,
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export async function getSuppliers(db: ScopedPrisma) {
  const suppliers = await db.supplier.findMany({
    include: { purchaseInvoices: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  return suppliers.map((s) => {
    const totalInvoiced = s.purchaseInvoices.reduce(
      (acc, inv) => acc + inv.totalAmount,
      0
    );
    const totalPaid = s.payments
      .filter((p) => p.type === "OUT")
      .reduce((acc, p) => acc + p.amount, 0);
    return { ...s, balance: totalInvoiced - totalPaid };
  });
}

export async function getSupplierById(db: ScopedPrisma, id: string) {
  return db.supplier.findUnique({
    where: { id },
    include: { purchaseInvoices: true, payments: true },
  });
}

export async function createSupplier(db: ScopedPrisma, data: SupplierInput) {
  const payload: Prisma.SupplierUncheckedCreateInput = {
    organizationId: db.organizationId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
  };

  return db.supplier.create({
    data: payload,
  });
}

export async function updateSupplier(db: ScopedPrisma, id: string, data: SupplierInput) {
  const payload: Prisma.SupplierUncheckedUpdateInput = {
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
  };

  return db.supplier.update({
    where: { id },
    data: payload,
  });
}

export async function deleteSupplier(db: ScopedPrisma, id: string) {
  return db.supplier.delete({
    where: { id },
  });
}
