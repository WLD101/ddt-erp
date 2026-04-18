// modules/expenses/components/expense-form.tsx
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
import { Loader2, FileText, DollarSign, Tag, Calendar } from "lucide-react";
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
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input className="pl-10 bg-white/5 border-white/10" />
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
            label="Amount ($)"
          >
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/80" />
              <Input type="number" step="0.01" className="pl-10 bg-rose-500/5 border-rose-500/10 font-bold" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="category" 
            label="Line Item Category"
          >
            <Select onValueChange={(val) => form.setValue("category", val)} defaultValue={form.getValues("category")}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <div className="flex items-center">
                   <Tag className="w-4 h-4 mr-2 text-muted-foreground/60" />
                   <SelectValue placeholder="Select classification" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
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
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input type="date" className="pl-10 bg-white/5 border-white/10" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-12 text-md font-extrabold uppercase tracking-widest shadow-xl shadow-rose-500/10 transition-all active:scale-95 bg-rose-500 hover:bg-rose-600"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : initialData ? "Synchronize Record" : "Log Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
