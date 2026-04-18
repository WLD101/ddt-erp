// modules/payments/components/payment-form.tsx
"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPayment, updatePayment } from "../actions";
import { toast } from "sonner";
import { Loader2, DollarSign, Wallet2, Hash, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { cn } from "@/lib/utils";

const paymentSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().optional(),
  date: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  initialData?: any;
  fixedType?: "IN" | "OUT";
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Credit Card",
  "Check",
  "Digital Wallet",
  "Other"
];

export function PaymentForm({ initialData, fixedType, onSuccess }: PaymentFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      type: fixedType || initialData?.type || "IN",
      amount: initialData?.amount || 0,
      paymentMethod: initialData?.paymentMethod || "Bank Transfer",
      referenceNumber: initialData?.referenceNumber || "",
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    },
  });

  function onSubmit(data: PaymentFormValues) {
    startTransition(async () => {
      const result = initialData 
        ? await updatePayment(initialData.id, data)
        : await createPayment(data);

      if (result.success) {
        toast.success(initialData ? "Payment synchronized" : "Payment processed");
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
          title="Transaction Classification" 
          description="Define the nature of the movement"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="type" 
            label="Movement Type"
          >
            <div className="flex gap-2">
              <Button
                type="button"
                variant={form.watch("type") === "IN" ? "default" : "outline"}
                disabled={!!fixedType}
                onClick={() => form.setValue("type", "IN")}
                className={cn(
                  "flex-1 gap-2 h-11",
                  form.watch("type") === "IN" && "bg-emerald-500 hover:bg-emerald-600 border-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                )}
              >
                <ArrowUpRight className="w-4 h-4" /> Received
              </Button>
              <Button
                type="button"
                variant={form.watch("type") === "OUT" ? "default" : "outline"}
                disabled={!!fixedType}
                onClick={() => form.setValue("type", "OUT")}
                className={cn(
                  "flex-1 gap-2 h-11",
                  form.watch("type") === "OUT" && "bg-amber-500 hover:bg-amber-600 border-transparent shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                )}
              >
                <ArrowDownRight className="w-4 h-4" /> Paid
              </Button>
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="amount" 
            label="Total Value ($)"
          >
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <Input type="number" step="0.01" className="pl-10 bg-white/5 border-white/10 font-black text-lg" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <FormSection 
          title="Methodology" 
          description="Execution and tracking details"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="paymentMethod" 
            label="Channel"
          >
            <Select onValueChange={(val) => form.setValue("paymentMethod", val)} defaultValue={form.getValues("paymentMethod")}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <div className="flex items-center">
                  <Wallet2 className="w-4 h-4 mr-2 text-muted-foreground/60" />
                  <SelectValue placeholder="Selecting channel..." />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="referenceNumber" 
            label="Reference / Check #"
            placeholder="E.g. TXN-99812"
          >
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input className="pl-10 bg-white/5 border-white/10 italic" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="date" 
            label="Executed On"
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
            className="w-full h-12 text-md font-extrabold uppercase tracking-widest shadow-xl transition-all active:scale-95"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : initialData ? "Synchronize Payment" : "Execute Transaction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
