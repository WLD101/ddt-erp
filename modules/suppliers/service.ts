import { ScopedPrisma } from "@/lib/db/client";
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
  return db.supplier.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  });
}

export async function updateSupplier(db: ScopedPrisma, id: string, data: SupplierInput) {
  return db.supplier.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  });
}

export async function deleteSupplier(db: ScopedPrisma, id: string) {
  return db.supplier.delete({
    where: { id },
  });
}
