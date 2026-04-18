import { z } from "zod";

export const expenseSchema = z.object({
  description: z.string().min(2, "Description must be at least 2 characters"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  date: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
