import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema, dateSchema } from "@/lib/validations/common";
import { recordLedgerEntry } from "../finances/service";

export const expenseSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  description: z.string().min(1, "Description is required"),
  amount: moneySchema.refine(n => n > 0, "Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  date: dateSchema.default(() => new Date()),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export async function getExpenses(db: ScopedPrisma) {
  return db.expense.findMany({
    include: { account: true },
    orderBy: { date: "desc" },
  });
}

export async function createExpense(db: ScopedPrisma, branchId: string, data: ExpenseInput) {
  return db.$transaction(async (tx: any) => {
    // 1. Create the expense record
    const expense = await tx.expense.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        accountId: data.accountId,
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: data.date,
      },
    });

    // 2. Record Ledger Entry & Update Account Balance
    await recordLedgerEntry(tx, {
      organizationId: db.organizationId,
      branchId,
      accountId: data.accountId,
      amount: -data.amount,
      description: `Expense: ${data.description} (${data.category})`,
      referenceType: "EXPENSE",
      referenceId: expense.id,
    });

    return expense;
  });
}

export async function updateExpense(db: ScopedPrisma, id: string, data: Partial<ExpenseInput>) {
  return db.expense.update({
    where: { id },
    data: {
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: data.date,
    },
  });
}

export async function deleteExpense(db: ScopedPrisma, id: string) {
  return db.expense.delete({
    where: { id },
  });
}
