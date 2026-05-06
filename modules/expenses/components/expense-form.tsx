// modules/expenses/components/expense-form.tsx
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, ExpenseFormValues } from "../schema";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransition } from "react";
import { createExpense, updateExpense } from "../actions";
import { Expense } from "@prisma/client";
import { toast } from "sonner";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";

interface ExpenseFormProps {
  initialData?: Expense | null;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Office Supplies",
  "Marketing",
  "Travel",
  "Software/Subscripts",
  "Maintenance",
  "Other"
];

export function ExpenseForm({ initialData, onSuccess }: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount || 0,
      category: initialData?.category || "Other",
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    },
  });

  function onSubmit(data: ExpenseFormValues) {
    startTransition(async () => {
      const result = initialData 
        ? await updateExpense(initialData.id, data)
        : await createExpense(data);

      if (result.success) {
        toast.success(initialData ? "Expense record updated" : "Expense recorded successfully");
        onSuccess?.();
      } else {
        toast.error(result.error || "Operation failed");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <FormSection 
          title="Transaction Details" 
          description="General information about the outflow"
          columns={1}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="description" 
            label="Description" 
            placeholder="E.g. Monthly Office Rent - April 2026"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">description</span>
              <Input className="pl-10" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <FormSection 
          title="Financial Mapping" 
          description="Classification and impact"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="amount" 
            label="Amount (Rs.)"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-error">payments</span>
              <Input type="number" step="0.01" className="pl-10 font-bold text-error bg-error/[0.02]" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="category" 
            label="Line Item Category"
          >
            <Select onValueChange={(val) => form.setValue("category", val)} defaultValue={form.getValues("category")}>
              <SelectTrigger>
                <div className="flex items-center">
                   <span className="material-symbols-outlined text-[18px] mr-2 text-outline">label</span>
                   <SelectValue placeholder="Select classification" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-outline-variant shadow-lg rounded-xl">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="date" 
            label="Transaction Date"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">calendar_today</span>
              <Input type="date" className="pl-10" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <div className="pt-6 border-t border-outline-variant/30">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-12 text-md font-extrabold uppercase tracking-widest shadow-xl shadow-error/10"
          >
            {isPending ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : initialData ? "Synchronize Record" : "Log Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
