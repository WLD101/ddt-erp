import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema, dateSchema } from "@/lib/validations/common";
import { recordLedgerEntry } from "../finances/service";

export const paymentSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  amount: moneySchema.refine(n => n > 0, "Amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  accountId: z.string().min(1, "Account is required"), // Linked to FinancialAccount
  referenceNumber: z.string().nullish(),
  date: dateSchema.default(() => new Date()),
  customerId: z.string().nullish(),
  supplierId: z.string().nullish(),
  salesInvoiceId: z.string().nullish(),
  purchaseInvoiceId: z.string().nullish(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export async function getPayments(db: ScopedPrisma) {
  return db.payment.findMany({
    include: {
      account: true,
      customer: true,
      supplier: true,
      salesInvoice: true,
      purchaseInvoice: true,
    },
    orderBy: { date: "desc" },
  });
}

export async function createPayment(db: ScopedPrisma, branchId: string, data: PaymentInput) {
  return db.$transaction(async (tx: any) => {
    // 1. Create the payment record
    const payment = await tx.payment.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        accountId: data.accountId,
        type: data.type,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        date: data.date,
        customerId: data.customerId,
        supplierId: data.supplierId,
        salesInvoiceId: data.salesInvoiceId,
        purchaseInvoiceId: data.purchaseInvoiceId,
      },
    });

    // 2. Record Ledger Entry & Update Account Balance
    await recordLedgerEntry(tx, {
      organizationId: db.organizationId,
      branchId,
      accountId: data.accountId,
      amount: data.type === "IN" ? data.amount : -data.amount,
      description: `Payment: ${data.referenceNumber || payment.id} (${data.paymentMethod})`,
      referenceType: "PAYMENT",
      referenceId: payment.id,
    });

    // 3. Auto-mark Sales Invoice as PAID if fully covered
    if (data.salesInvoiceId) {
      const invoice = await tx.salesInvoice.findUnique({
        where: { id: data.salesInvoiceId },
        include: { payments: true },
      });
      if (invoice) {
        const totalPaid = invoice.payments.reduce((acc, p) => acc + p.amount, 0);
        if (totalPaid >= invoice.totalAmount) {
          await tx.salesInvoice.update({
            where: { id: invoice.id },
            data: { status: "PAID" },
          });
        }
      }
    }

    // 3. Auto-mark Purchase Invoice as PAID if fully covered
    if (data.purchaseInvoiceId) {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: data.purchaseInvoiceId },
        include: { payments: true },
      });
      if (invoice) {
        const totalPaid = invoice.payments.reduce((acc, p) => acc + p.amount, 0);
        if (totalPaid >= invoice.totalAmount) {
          await tx.purchaseInvoice.update({
            where: { id: invoice.id },
            data: { status: "PAID" },
          });
        }
      }
    }

    return payment;
  });
}

export async function updatePayment(db: ScopedPrisma, id: string, data: Partial<PaymentInput>) {
  return db.payment.update({
    where: { id },
    data: {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      date: data.date,
    },
  });
}

export async function deletePayment(db: ScopedPrisma, id: string) {
  return db.payment.delete({
    where: { id },
  });
}
